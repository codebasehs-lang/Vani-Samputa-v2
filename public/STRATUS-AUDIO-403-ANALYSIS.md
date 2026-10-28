# Private Stratus Audio: 403 Findings and Resolution

> **Public-file warning:** This Markdown file is in Next.js `public/` and may be served to anyone who can access the site. It contains no credentials or signed URLs. Do not add API keys, shared secrets, access tokens, or temporary playback URLs here.

## Findings

- The audio objects are in the Catalyst Stratus **Development** bucket `vani-samputa-audio`. The inventory lists the bucket URL as `https://vani-samputa-audio-development.zohostratus.in`.
- The inventory says anonymous `HEAD` requests to the first and last objects returned HTTP 403. This is consistent with private/authenticated access; it does not by itself indicate a broken object or a bad permission rule.
- The permission rule shown in the Zoho Console allows `GetObject` for authenticated Catalyst users at `vani-samputa-audio::/*`. It covers objects in that bucket. No public access rule is needed for private playback.
- “Authenticated” in the Stratus rule refers to Catalyst authentication. A user signed into this website through NextAuth is not automatically authenticated to Catalyst Stratus.
- The inventory’s plain object URLs are not signed links. Adding a bare `?` does not sign a URL.
- The app backend is deployed on Hostinger. The existing Next.js route `src/app/api/audio/[id]/route.ts` reads a lecture URL from the database and fetches that plain URL, forwarding byte-range requests. It currently does not check a NextAuth session before serving audio. The player in `src/components/player/AudioEngine.tsx` assigns the track URL directly to the audio element.
- The Stratus SDK overview lists generating a presigned download URL as an Admin-scope operation. The Node.js SDK v2 page is marked deprecated and recommends migrating to the JavaScript SDK. Do not rely on guessed SDK method names or examples for a deprecated SDK.

## Recommended private playback flow

Keep the bucket private. Authenticate the listener to this app and authorize every playback URL request on the server:

1. The player requests the existing Hostinger endpoint using the lecture ID.
2. The Hostinger route validates the app's NextAuth session, looks up that lecture in the database, and confirms it is audio.
3. A trusted server-side integration generates a short-lived, read-only Stratus download URL for that lecture's known object key.
4. The server returns the URL to the signed-in player, which plays the audio from Stratus.

Because Hostinger is outside Catalyst, use a Catalyst serverless function as the signing service. The current JavaScript SDK signing method has been confirmed; the Catalyst-to-function authentication still needs end-to-end verification after deployment. Protect the function from arbitrary callers; validate the requested object against the app's known audio records or an allowed bucket path. Keep all credentials in server-side Hostinger/Catalyst environment settings, never in browser code or `NEXT_PUBLIC_` variables.

If this integration cannot be authenticated safely from Hostinger, another option is to have a trusted server-side service stream the object after authorized Stratus access. Preserve HTTP `Range`/`206` handling for seeking; returning a temporary URL is generally simpler for large audio files.

## Implementation progress

- A standalone Node.js 22 Catalyst Advanced I/O function is in [zoho-catalyst/stratus-audio-signer](../zoho-catalyst/stratus-audio-signer/). It is separate from the Next.js app. The Development Function URL is `https://vani-samputa-audio-60092075946.development.catalystserverless.in/server/vani-audio-url-signer/`.
- The function accepts `GET` requests with an `X-Audio-Signer-Secret` header and a `key` query parameter. It checks the shared secret, restricts keys to a configured object prefix, and requests a read-only Stratus URL with a 3600-second expiry. Do not send this shared secret as an OAuth bearer token: Catalyst rejected that request with `INVALID_TOKEN` before invoking the function.
- The current `@zcatalyst/stratus` SDK API was verified: `BucketAdmin.generatePreSignedUrl(key, "GET", { expiryIn })` returns the URL in `signature`. Catalyst authentication and Stratus signing have only been exercised with mocks locally; the function still needs validation in a Catalyst Development project.
- Set these function environment variables in the Catalyst **Development** environment, without putting secrets in this public document or source control:
  - `STRATUS_BUCKET_NAME`: `vani-samputa-audio` for Development.
  - `AUDIO_OBJECT_PREFIX`: `HH Haladhara Swami Maharaj/`. The inventory lists all 2,178 audio objects under this folder.
  - `SIGNER_SHARED_SECRET`: a strong secret also stored only in Hostinger's server-side environment.
- Verify that Catalyst's deployed Advanced I/O function receives and preserves the custom secret header, and test unauthenticated, invalid-key, and authorized requests. The Hostinger route now authenticates the NextAuth user and resolves the lecture ID to its trusted Stratus object key before calling the signer; it does not accept a client-supplied object key. Confirm the signer cannot be used without the shared secret.
- The function currently allows any key under the configured prefix, so prefix validation alone is not per-lecture authorization. The Hostinger route's database lookup is required to constrain requests to existing audio lectures. Also validate URL expiry, playback, and seeking against a real Development object before production setup.
- The Next.js `/api/audio/[id]` route now requires a NextAuth session, gets the object key only from the matching audio lecture's stored Development URL, calls the Catalyst signer, and forwards byte-range requests to Stratus. It checks both the stored URL origin and signer-returned URL origin. Local tests use mocked signer and object fetches; live Catalyst auth/signing and real playback still need verification.
- Set these Hostinger application environment variables (and locally in the ignored root `.env` for local playback). Never commit `.env` or put the secret in a `NEXT_PUBLIC_` variable:
  - `CATALYST_AUDIO_SIGNER_URL`: the Development Function URL listed above.
  - `CATALYST_AUDIO_SIGNER_SECRET`: the same value configured as `SIGNER_SHARED_SECRET` in Catalyst.
  - `STRATUS_AUDIO_BUCKET_ORIGIN`: `https://vani-samputa-audio-development.zohostratus.in`.
- The function URL and bucket origin are Development-only. Configure matching Production values only after creating and testing the Production function and bucket.

## What to configure in Zoho

1. Keep the current bucket permission rule. Do not change it to Public to suppress the 403.
2. Confirm the rule is saved in the **Development** project/environment that contains the bucket.
3. Create a Node.js 22 Advanced I/O function named `vani-audio-url-signer` and deploy the starter in `zoho-catalyst/stratus-audio-signer/`.
4. Configure `STRATUS_BUCKET_NAME=vani-samputa-audio` and `AUDIO_OBJECT_PREFIX=HH Haladhara Swami Maharaj/`, plus `SIGNER_SHARED_SECRET`, as function environment variables. Keep the same secret only in Hostinger's server-side environment too; never commit or share its value.
5. The documented presigned-download operation requires Admin scope. Keep the signing function private behind its authentication check; do not expose its Admin-scoped credentials to the browser.
6. Verify the deployed function's request authentication and SDK initialization in Development. The shared-secret check in the starter is a proposed service-to-service guard and still requires an end-to-end deployment test.

### Deployment troubleshooting

- `Cannot find module '@zcatalyst/auth/node'` means the deployed runtime could not load the SDK. The `/node` export exists in `@zcatalyst/auth@1.0.0`. Deploy the signer's own `package.json` with both `@zcatalyst/auth` and `@zcatalyst/stratus` dependencies and ensure the deployment installs them; copying only `index.js` is insufficient.
- After deploying the updated signer, test in Postman with Authorization set to **No Auth**, no `Authorization` header, and an `X-Audio-Signer-Secret` header containing the configured secret. Keep the existing `key` query parameter. Without the custom header, the loaded handler should return `401` with `{"error":"Unauthorized"}`.
- Deploy the matching Next.js audio-route update as well: both the app and function must use the custom header. Environment variable names and secret values are unchanged.

## Verification checklist

- An unauthenticated request to the Hostinger audio endpoint is rejected.
- Direct requests to the Catalyst signing function without the shared secret are rejected.
- A signed-in user can request only an existing audio lecture; invalid IDs and non-audio records are rejected.
- The generated URL points to the Development object and expires after a suitably short period.
- Playback, seeking, and track changes work. For long tracks, ensure the expiry is long enough for playback and byte-range requests, or refresh the link when necessary.
- The Catalyst signing endpoint cannot be used anonymously to sign arbitrary bucket paths.
- Production has its own matching bucket, permission setup, and server-side configuration before production traffic is switched.

## Documentation

- [Stratus JavaScript SDK overview](https://docs.catalyst.zoho.com/en/sdk/javascript/v1/cloudscale/stratus/overview/)
- [Stratus permissions](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/stratus-permissions/)
- [Stratus object URLs](https://docs.catalyst.zoho.com/en/cloud-scale/help/stratus/objects/introduction/)
- [Node.js SDK v2 Stratus overview (deprecated)](https://docs.catalyst.zoho.com/en/sdk/nodejs/v2/cloud-scale/stratus/overview/)
