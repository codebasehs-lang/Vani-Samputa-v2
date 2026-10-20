This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Documentation

- Admin lecture upload guide: [docs/admin-lecture-upload-guide.md](docs/admin-lecture-upload-guide.md)

## Admin playlists

The Playlists admin page supports title search and combined language, media type,
and category filters, including playlists without categories. Clear filters
restores the full list. Category edits apply to the playlist's grouping, not to
its individual lectures.

Expand a playlist to load all its lectures in playlist order. The expanded
section supports editing, confirmed deletion, and adding a new lecture without
leaving the page. The lecture form is bound to the exact playlist ID (not just
its title), with its language and media type fixed to the playlist. New lectures
start with the playlist's categories selected. Successful changes reload the
lecture list and update its count.
Video lecture actions also include a YouTube icon that opens the original video
in a new tab. Audio lectures do not show this action.

Each playlist has a Delete action with an explicit confirmation. Deleting a
playlist permanently deletes all lectures associated with it and their saved
notes, favorites, history, and progress, as well as playlist favorites. The
playlist and lecture deletions run in one database transaction; other playlists
and standalone lectures are not deleted. This removes application records, not
the original videos or externally hosted audio files.

Run the playlist regression tests without connecting to a database:

```bash
node --test src/app/api/admin/playlists/route.test.mjs src/app/api/admin/lectures/route.test.mjs src/components/admin/AdminPlaylistsTable.test.mjs src/components/admin/PlaylistLectures.test.mjs
```

## Playback history

Selecting an audio or video lecture queues the remaining lectures in that playlist
in the displayed order. When a lecture finishes, the next starts automatically;
playback stops after the last lecture unless more tracks were added to the queue.
Choosing another lecture replaces the queue with the rest of its playlist, and
audio Play all restarts from the first lecture without duplicating queued tracks.
Video details and the highlighted playlist item follow the currently playing
lecture, including in audio-only mode. Playlist queues survive page navigation
and app restarts, but reopening the app does not autoplay. If the browser blocks
video autoplay, a message prompts the listener to press Play.

The service worker caches static assets and public offline pages, but never
API/session responses, RSC payloads, or private pages. A worker version update
clears old runtime caches while preserving downloaded audio. The header waits
for the session check before showing Log in.

Recently Played shows each audio/video track's last playback time and completion
percentage when its duration is known. Selecting a recent track resumes from that
time. Selecting a video in its playlist also resumes its saved position.
Positions are updated during playback, seeking, pause, backgrounding, and player
teardown, and saved with the player history in local storage. This survives
closing and reopening the browser or installed mobile PWA on the same device
and site origin. Existing session-storage history is migrated automatically.
If local storage is unavailable, session storage is used with a console warning.
Older history entries without saved progress start at 0:00.

Continue Listening and Recently Played appear on mobile after playback on that
device; desktop history is not synced to a phone or a different site origin.
Reopening does not autoplay: use Continue Listening to resume. Its play/pause
button controls both audio and video. Clearing site/app data also clears history.
The PWA worker version is refreshed for this update to replace old cached app
pages without deleting playback history or downloaded audio. Open the installed
app online after deployment so it can receive the update.

## Getting Started

The login and registration portrait row displays Gurudeva, Srila Gurudeva,
and Srila Prabhupada from left to right, beneath the Sri Madhava portrait.
The brand emblem fits inside its gold ring without zoom cropping, and the
Sri Madhava portrait uses a centered, unzoomed crop to show more of both sides.
On desktop auth pages, the portrait and parampara group sit slightly higher,
with the rotating mandala centered on Sri Madhava. Mobile keeps its compact spacing.

The installed mobile PWA has a midnight-indigo launch welcome with the brand
emblem, a gold-and-lotus illustration, and a dedication to Sri Guru and Gauranga.
The hero's portrait row sits above the emblem: Sri Madhava, Srila Prabhupada,
Srila Gurudeva, and Gurudeva appear one by one from left to right before the
welcome fades to the underlying page. Reduced motion shows all portraits immediately.
It appears on a fresh launch (not on in-app navigation), then gently reveals
the underlying page with a 900ms eased fade (about 3 seconds total). Enter uses
the same fade rather than abruptly removing the welcome. Reduced-motion users get a short,
non-animated welcome. The existing desktop first-visit splash is unchanged;
ordinary mobile browser visits do not show the PWA welcome. The operating
system's initial splash remains browser-controlled (manifest logo/background);
the detailed lotus design is included in the initial HTML and shown by a
standalone/mobile CSS media query before hydration. A synchronous head script
also detects iOS standalone mode and guards the first paint with an indigo
background and hidden home content until the custom splash takes over.
The splash sits outside the application/session providers, and the first-paint
guard is released only after its hydrated state commits. Client startup then manages
its dismissal without remounting the artwork. Manifest and standalone browser
chrome use the same indigo as the custom launch screen; ordinary browser chrome
keeps its cream color. Small, pre-generated WebP portraits and the shared logo
are precached by the production service worker for faster repeat/offline launches.
The native splash cannot be disabled, and existing installations may take time
to refresh their manifest branding.

Home search works in the browser and installed PWA and requires an internet
connection. It shows loading and connection/request errors with a retry button.
Changing the query cancels the previous request so slower replies cannot replace
newer results. On mobile, focusing search scrolls it into view, and the results
tray uses the available viewport height.

The homepage queries its data at request time rather than at build time, so
daily quote imports and edits are reflected on the next page load. Only a quote
scheduled for today's month and day (using the server's timezone) is selected;
the year is ignored and quotes repeat annually. The sample quote is shown when
no matching entry exists in the connected database.

Daily Quotes admin uses a month selector and MM-DD template dates, including
February 29. Imports accept MM-DD, YYYY-MM-DD with optional time, YYYY/MM/DD,
DD/MM/YYYY (also dots/hyphens and two-digit years), English month names, and Excel
date cells/serials. Ambiguous numeric year-last dates are day-first. Invalid
month/day combinations are reported as row errors rather than rolled forward.
The preview, list, and edit dialog show month/day without a year.

Existing stored dates remain compatible without a database migration. When
different years contain the same month/day, the latest stored year wins.
Re-importing updates that entry regardless of the incoming year; new entries use
the leap year 2000 internally solely to fit the existing date column. Deleting a
day removes all its historical versions so an older quote cannot reappear.
February 29 is shown only on February 29, not substituted on non-leap years.

The home hero keeps side portraits at viewport widths of 1024px and above,
with a scaled laptop layout below 1360px. Below 1024px, portraits appear in a
compact row above the title. Browser zoom changes the effective viewport width.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
