const { createHash, timingSafeEqual } = require("node:crypto")
const { zcAuth } = require("@zcatalyst/auth/node")
const { Stratus } = require("@zcatalyst/stratus")

const URL_EXPIRY_SECONDS = 9000

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  })
  res.end(JSON.stringify(payload))
}

function matchesSecret(provided, expected) {
  const providedHash = createHash("sha256").update(provided).digest()
  const expectedHash = createHash("sha256").update(expected).digest()
  return timingSafeEqual(providedHash, expectedHash) && provided.length > 0
}

function isSafeObjectKey(key, prefix) {
  if (
    typeof key !== "string"
    || key.length > 1024
    || !key.startsWith(prefix)
    || /[\u0000-\u001f\u007f]/.test(key)
  ) {
    return false
  }

  return key
    .split("/")
    .every((segment) => segment.length > 0 && segment !== "." && segment !== "..")
    && !key.includes("\\")
    && !key.includes("?")
    && !key.includes("#")
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return sendJson(res, 405, { error: "Method not allowed" })
  }

  const expectedSecret = process.env.SIGNER_SHARED_SECRET
  if (!expectedSecret) {
    return sendJson(res, 500, { error: "Server configuration error" })
  }

  const secretHeader = req.headers["x-audio-signer-secret"]
  const providedSecret = typeof secretHeader === "string" ? secretHeader : ""
  if (!matchesSecret(providedSecret, expectedSecret)) {
    return sendJson(res, 401, { error: "Unauthorized" })
  }

  const bucketName = process.env.STRATUS_BUCKET_NAME
  const objectPrefix = process.env.AUDIO_OBJECT_PREFIX
  if (
    !bucketName
    || !objectPrefix
    || objectPrefix.startsWith("/")
    || !objectPrefix.endsWith("/")
    || objectPrefix.includes("\\")
    || /[\u0000-\u001f\u007f?#]/.test(objectPrefix)
    || objectPrefix
      .slice(0, -1)
      .split("/")
      .some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return sendJson(res, 500, { error: "Server configuration error" })
  }

  let requestUrl
  try {
    requestUrl = new URL(req.url, "http://catalyst.local")
  } catch {
    return sendJson(res, 400, { error: "Invalid request URL" })
  }

  const objectKey = requestUrl.searchParams.get("key")
  if (!isSafeObjectKey(objectKey, objectPrefix)) {
    return sendJson(res, 400, { error: "Invalid audio object key" })
  }

  try {
    const app = await zcAuth.init(req, {
      type: "advancedio",
      appName: "vani-audio-url-signer",
      scope: "admin",
    })
    const bucket = new Stratus(app).bucket(bucketName)
    const signedUrl = await bucket.generatePreSignedUrl(
      objectKey,
      "GET",
      { expiryIn: String(URL_EXPIRY_SECONDS) },
    )

    if (typeof signedUrl?.signature !== "string" || !signedUrl.signature.startsWith("https://")) {
      throw new Error("Stratus returned an invalid pre-signed URL")
    }

    return sendJson(res, 200, {
      url: signedUrl.signature,
      expiresIn: URL_EXPIRY_SECONDS,
    })
  } catch (error) {
    console.error("Could not create an audio pre-signed URL", {
      name: error?.name,
      statusCode: error?.statusCode,
    })
    return sendJson(res, 502, { error: "Could not create audio URL" })
  }
}
