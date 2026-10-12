This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Project Documentation

- Admin lecture upload guide: [docs/admin-lecture-upload-guide.md](docs/admin-lecture-upload-guide.md)

## Playback history

Recently Played shows each audio/video track's last playback time and completion
percentage when its duration is known. Selecting a recent track resumes from that
time. Positions are updated during playback, seeking, and player teardown, and
saved with the player history in session storage (surviving reloads in the same
browser tab). Older history entries without saved progress start at 0:00.

## Getting Started

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
