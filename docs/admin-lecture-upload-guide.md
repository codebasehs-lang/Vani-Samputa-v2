# Admin Lecture Upload Guide

This guide explains how to upload lectures from the admin panel, how playlists are related to lectures, and how to prepare an Excel file for bulk upload.

## Zoho Stratus Audio: Ready-to-Use Format

Use the example workbook at [public/zoho-audio-import-example.xlsx](../public/zoho-audio-import-example.xlsx), or select Audio and Download Sample Excel on `/admin/import`.

Use one row per MP3, with these headers:

```text
Title | URL | Media Type | Language | Categories | Playlist | Duration | Lecture Date
```

The URL cell must contain the **permanent object URL**, for example:

```text
https://vani-samputa-audio-development.zohostratus.in/HH%20Haladhara%20Swami%20Maharaj/0001%20BG%2003-01%20-%20Introduction%20to%20Chapter%20Three%20-%202022-02-15.mp3
```

Spaces in the object URL are accepted and normalized to `%20`. Preserve the exact folder and filename, including capitalization, punctuation and the numeric prefix. The displayed Title can be friendlier than the filename.

Do not put any of these in the URL column:

- A temporary `/_signed/` playback URL or any URL with signature/query parameters.
- The Catalyst serverless function URL.
- The application's `/api/audio/...` URL.
- The ZIP filename, a local disk path, or just an MP3 filename.
- A shared secret or other credential.

### Example Rows

The workbook contains these three real object paths; all are under `HH Haladhara Swami Maharaj/` in the Development bucket:

| Title | Object filename used in URL | Media Type | Language | Categories | Playlist | Duration | Lecture Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Introduction to Chapter Three | 0001 BG 03-01 - Introduction to Chapter Three - 2022-02-15.mp3 | AUDIO | English | Bhagavad Gita | | 01:06:44 | 2022-02-15 |
| Europe Tour - Belgium | 0003 Europe Tour-01-Belgium.mp3 | AUDIO | English | General | Europe Tour | | |
| Europe Tour - France | 0004 Europe Tour-02-France.mp3 | AUDIO | English | General | Europe Tour | | |

The actual workbook's URL cells contain full permanent HTTPS URLs, not only the filenames shown in this table. The first row is standalone because Playlist is empty. The other two rows create or reuse one `Europe Tour` playlist. Change the sample language/category metadata to match your catalog before importing.

- Create the active categories `Bhagavad Gita` and `General` in Admin -> Categories before importing this sample. Alternatively, replace them with existing active category names.
- For additional playlists, repeat the exact same Playlist name, Language and Media Type on each related row. A different Playlist name creates a separate playlist.
- Leave Playlist truly empty for standalone lectures; do not enter `None`, `Standalone`, or `-`.
- Categories can contain multiple existing names separated by commas. Categories do not determine playlist membership.
- Duration is optional. Use whole seconds, or set the Excel cell format to Text and enter `HH:MM:SS`. Blank durations are learned by the player during playback.
- Lecture Date is optional. Prefer `YYYY-MM-DD`; Excel date serials are also supported.
- Put lecture rows on the first worksheet. Both `.xlsx` and `.xls` are supported.
- The upload page retains every row and sends sequential batches of 100. Duplicate normalized URLs are skipped. Errors identify the Excel row number, including the header row.
- A new filename is a new lecture URL. Import is not an edit operation for existing lectures or playlist membership; edit existing records through the admin screens.
- Import validates the URL shape and configured bucket, but does not check every object's existence or request signed URLs during import. Test a lecture after importing.

### App Server Configuration

Set these in the app server's environment and locally in the ignored root `.env` for development. Restart/redeploy the app after changes:

```dotenv
CATALYST_AUDIO_SIGNER_URL=https://vani-samputa-audio-60092075946.development.catalystserverless.in/server/vani-audio-url-signer/
CATALYST_AUDIO_SIGNER_SECRET=<same value as SIGNER_SHARED_SECRET in Zoho>
STRATUS_AUDIO_BUCKET_ORIGIN=https://vani-samputa-audio-development.zohostratus.in
```

Never prefix these variables with `NEXT_PUBLIC_`. Keep the shared secret out of the workbook, source control and browser code.

The audio files stay in the private Stratus bucket. The ZIP uploaded to Serverless contains the signer code and SDK dependencies, not the audio files. Keep `STRATUS_BUCKET_NAME=vani-samputa-audio`, `AUDIO_OBJECT_PREFIX=HH Haladhara Swami Maharaj/`, and the matching `SIGNER_SHARED_SECRET` on that function. New links use the deployed function's expiry; set its `URL_EXPIRY_SECONDS` to `9000` for 2 hours 30 minutes.

At playback, a signed-in listener requests `/api/audio/{lectureId}`. The app looks up the permanent URL, derives its object key, calls the function with `X-Audio-Signer-Secret`, and streams the signed Stratus response. Range requests are forwarded for seeking. The workbook never needs updating when signed URLs expire; each playback/range request obtains a fresh signed URL.

### Upload and Verify

1. Configure the app server and existing active categories.
2. Open Admin -> Import, select Audio, and choose the workbook.
3. Check the preview and total row count, then click Import All Rows.
4. Review created/skipped counts and any row errors.
5. Sign in as a listener, open the playlist or standalone lecture, and test playback plus seeking. The app audio request should return `200` or `206`.
6. Confirm the app audio endpoint rejects a signed-out request with `401`. Confirm the signer rejects a request without its custom secret header with `401`.

These URLs refer to Development. Do not mix Development URLs with Production bucket/function settings. Production needs its own tested matching configuration.

## 1. Lecture-Playlist Relation (Important)

- One playlist can have many lectures.
- One lecture can belong to only one playlist.
- Playlist link in lecture is optional. A lecture can exist without playlist.

Current database relation:

- Playlist -> lectures (one-to-many)
- Lecture -> playlistId (nullable)

### How playlist matching works during upload

When you provide a playlist name, the system tries to find an existing playlist using:

- Playlist title
- Lecture language
- Lecture media type (AUDIO or VIDEO)

If found, the lecture connects to that playlist.
If not found, a new playlist is created automatically and the lecture is connected.

## What Is Category Used For?

Category is a broad subject or content grouping. It is not the playlist name.

Examples:

- Gita
- Bhagavatam
- Meditation
- Bhajan
- Philosophy
- General

### Playlist category

For a playlist, Category is used on the public Audio and Video language pages as a section heading. For example, all playlists with category `Gita` appear under the `Gita` heading.

### Lecture category

For a lecture, Category is saved as lecture information. The lecture is connected to a playlist only through the Playlist Name field, not through Category. At present, the lecture category is not used as an independent filter in the admin lecture list.

### Recommended rule

Use the same category for a playlist and its lectures when they cover the same subject. Use the exact same spelling and capitalization for related rows.

## 1A. Category/Tag Design

The system uses one shared Category model for reusable tags:

```text
Category
- id
- name (unique)
- slug (unique)
- sortOrder
- active

Playlist <-> Category (many-to-many)
Lecture <-> Category (many-to-many)
```

This allows:

- One playlist to have multiple categories.
- One lecture to have multiple categories.
- The same category to be reused across playlists and lectures.
- Categories to be managed from an admin screen instead of typed repeatedly.
- Users to select a tag and see matching playlists or lectures.

### Initial category list

The initial categories can be:

- Bhagavad Gita
- Srimad Bhagavatam
- Chaitanya-charitamrita
- Festival Lectures
- Vaishnava Songs & Bhajans
- Question & Answer Sessions
- Chanting Suddha Nama
- Guru Tattva
- Seva
- Goswami

More categories can be added later by an administrator without changing the database schema.

## 1B. How Tag Filtering Should Work in the UI

On each language Audio or Video page:

1. Show category/tag buttons or a multi-select control.
2. When a user selects one tag, show playlists or lectures having that tag.
3. If multiple tags are selected, use OR behavior by default, meaning content with any selected tag is shown.
4. Provide an `All` option to clear the filter.

For a playlist page, show all lectures in that playlist. The playlist's tags can also be displayed near its title.

## 1C. Lectures That Are Not in a Playlist

A lecture does not need a playlist. It can still have one or more categories:

- `playlistId` remains empty.
- Categories are attached directly to the lecture.
- The lecture appears in a standalone lecture/tag result.
- Users can find it by language, media type, or category.

Example:

```text
Lecture: Q&A on Sadhana
Playlist: none
Categories: Question & Answer Sessions, Guru Tattva
```

This keeps standalone content discoverable without creating unnecessary one-lecture playlists.

## 1D. Upload Format for Category Tags

For Excel imports, use a `Media Type` column with `AUDIO` or `VIDEO` for each row. You can upload audio and video lectures in the same Excel file. If this column is empty or absent, the Audio/Video toggle selected on the Import page is used.

Use a `Categories` column with comma-separated category names:

```text
Title | URL | Media Type | Language | Categories | Playlist | Duration | Lecture Date
Q&A on Sadhana | audio-url | AUDIO | Odia | Question & Answer Sessions, Guru Tattva | | 00:30:00 | 2026-08-25
Gita Lecture 1 | youtube-id | VIDEO | Odia | Bhagavad Gita | Morning Series | 00:40:00 | 2026-08-20
```

Processing rules:

1. Split the Categories cell by commas.
2. Trim each name and ignore blank values.
4. Find each category by exact name in the active admin-managed category list.
5. If any category does not exist, the row is rejected. Add it first from Admin -> Categories, then upload again.
6. Attach all found categories to the lecture.
7. If Playlist is supplied, attach the lecture to that playlist as well.
8. If Playlist is blank, save the lecture as a categorized standalone lecture.

For consistency, category names should be selected from the admin-managed list rather than typed manually in normal use.

### Category restriction

New category names cannot be created from the lecture form or Excel import. The administrator must first open Admin -> Categories and add the category there. Uploads then accept only an exact match to an active category name.

## 2. Single Lecture Upload (Admin Form)

Page:

- /admin/lectures/new

Steps:

1. Open Admin -> Lectures -> Add Lecture.
2. Fill required fields:
   - Title (required)
   - URL / YouTube ID (required)
3. Fill optional fields:
   - Playlist Name
   - Categories (comma-separated)
   - Duration (`HH:MM:SS`, for example `01:23:45`)
   - Lecture Date
   - Description
4. Select:
   - Type: AUDIO or VIDEO
   - Language: Odia, Hindi, or English
5. Click Save Lecture.

Result:

- If Playlist Name is empty: lecture is saved without playlist.
- If Playlist Name is provided:
  - Existing matching playlist is used, or
  - New playlist is auto-created and linked.

## 3. Bulk Upload from Excel (.xlsx or .xls)

Page:

- /admin/import

Steps:

1. Prepare an Excel file with headers.
2. In Admin -> Import, choose media type toggle first:
   - AUDIO or VIDEO
3. Upload the Excel file.
4. Review preview rows shown in UI.
5. Click Import All Rows.

Result summary is shown as:

- created: number of lectures inserted
- skipped: duplicates or invalid rows
- errors: processing errors (first 10 shown)

## 4. Excel Format for Upload

### Recommended header names

Use these exact column headers for best results:

- Title
- URL
- Media Type (optional if the Import page toggle is used; otherwise `AUDIO` or `VIDEO`)
- Language
- Categories
- Playlist
- Duration
- Lecture Date

### Supported header aliases (case-insensitive)

Title column can also be:

- name
- lecture

URL column can also be:

- link
- youtube id
- youtube_id
- videoid

Language column can also be:

- lang

Categories column can also be:

- category
- cat

Playlist column can also be:

- playlist name
- playlistname

Duration column can also be:

- duration (sec)
- seconds

Duration formats accepted:

- `01:23:45` = 1 hour, 23 minutes, 45 seconds
- `23:40` = 23 minutes, 40 seconds
- `1800` = 1800 seconds (legacy format)

The database stores duration as total seconds, while admins can enter it in a time format.

Lecture Date column can also be:

- lecture_date
- date
- event date

## 5. Required vs Optional Data

Required per row:

- Title
- URL

Optional per row:

- Language (default: Odia)
- Category (default: General)
- Playlist
- Duration
- Lecture Date (optional; recommended when known)

Lecture Date means the date the lecture actually happened. It is different from `createdAt` (upload date) and `publishedAt` (publication date). Use a date such as `2026-08-25` in Excel.

Category is optional because the system uses `General` when it is blank. It is recommended to enter a meaningful category so playlists are grouped correctly on the public pages.

## 6. How Playlist Connection Happens in Excel Upload

For each row:

1. System reads Playlist value.
2. If Playlist is empty, lecture is saved without playlist.
3. If Playlist has value:
   - It searches playlist by title + language + media type.
   - If not found, creates playlist using:
     - title = Playlist value
     - language = row language (or Odia default)
     - category = row category (or General default)
     - mediaType = selected toggle (AUDIO or VIDEO)
4. Lecture is created with that playlistId.

## 7. Duplicate and Skip Rules

- Duplicate check is by URL only.
- If an existing lecture already has same URL, row is skipped.
- If Title or URL is missing, row is skipped.

## 8. Current Import Limits

- UI currently imports up to first 200 rows from uploaded sheet.
- Use multiple files if you need to import more than 200 rows.

## 9. Suggested Excel Example

Header row:

- Title | URL | Language | Category | Playlist | Duration

Example rows:

- Bhagavad Gita 1 | https://example.com/audio1.mp3 | Odia | Gita | Morning Series | 1800
- Gita Talk Episode 2 | dQw4w9WgXcQ | English | Lecture | Sunday Class |

## 10. Best Practices

- Keep playlist names consistent (avoid spelling variations).
- Keep URL unique per lecture.
- Keep language and media type consistent for a playlist series.
- Test with 5 rows first before large upload.
