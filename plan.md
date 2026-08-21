# Vāṇī Saṃpuṭa v2 — Project Plan & Progress Tracker

> World-class spiritual lecture platform for HH Haladhara Swami Maharaja  
> Hare Krishna Hare Krishna Krishna Krishna Hare Hare | Hare Ram Hare Ram Ram Ram Hare Hare

---

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
| Database | MySQL on Hostinger VPS |
| ORM | Prisma v7 |
| Auth | NextAuth.js v5 + Prisma adapter (email + Google OAuth) |
| Mobile | PWA — installable on Android + iOS home screen (no App Store) |
| Audio files | Keep all existing external URLs as-is |
| Deployment | Next.js → Vercel (free) + MySQL on Hostinger VPS |
| Push | Web Push API (VAPID) |
| YouTube | YouTube Data API v3 (channel sync + live detection) |

---

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.3.2 |
| UI | React | 19.2.8 |
| Styling | Tailwind CSS | v4 |
| Animations | Framer Motion | v13 |
| Icons | Phosphor React | v1.4.1 |
| Global State | Zustand | v5 |
| Database | MySQL (Hostinger VPS) | — |
| ORM | Prisma | v7.9.1 |
| Auth | NextAuth.js | v5 beta |
| Auth Adapter | @auth/prisma-adapter | v2 |
| Excel Import | xlsx | v0.18.5 |
| Drag & Drop | @dnd-kit | v6/v10 |
| Push Notifications | web-push | v3.6.7 |
| Password Hashing | bcryptjs | v3 |

---

## Design System

- **Palette:** Deep Saffron `#FF6B35` · Sacred Gold `#FFD700` · Deep Blue `#1a1a3e` · Cream `#FFF8F0` · Lotus Pink `#E8A4C8`
- **Fonts:** Crimson Text (articles/body) · Inter (UI) · Noto Serif Devanagari (Sanskrit/Odia)
- **Style:** Glassmorphism cards · lotus/mandala dividers · Framer Motion page transitions
- **Scripts:** Odia · Devanagari · Latin — all rendered correctly

---

## Database Tables (Prisma / MySQL)

`User` · `Playlist` · `Lecture` · `Article` · `DailyVerse` · `UserFavorite` · `UserNote` · `UserHistory` · `UserProgress` · `LiveConfig` · `PushSubscription` · `Event`

---

## Reference Apps

| App | Feature Borrowed |
|---|---|
| Spotify | Persistent bottom mini-player, queue, sleep timer, speed 0.5–2× |
| Apple Podcasts | Transcript auto-scroll, chapter markers, speed presets |
| YouTube | Picture-in-Picture, floating mini-player on navigation |
| Headspace / Calm | Spiritual UI — saffron/gold palette, lotus motifs |
| Audible | Bookmarks + timestamped notes, progress sync across devices |
| Netflix | "Continue watching" row, offline download |
| Vedabase.io | Vaishnava archive browsing feel |
| Pocketcasts | Up-Next queue, swipe-to-add, effects panel |

---

## DB Migration Commands

```bash
npm run db:migrate        # dev — create + apply new migration
npm run db:migrate:prod   # production — safely apply on Hostinger VPS
npm run db:push           # quick schema sync (early dev only)
npm run db:seed           # populate all lecture data from v1
npm run db:studio         # open visual DB browser in browser
npm run db:reset          # wipe + re-migrate + re-seed (dev only!)
npm run db:generate       # regenerate Prisma TypeScript client
```

---

## Progress Tracker

### ✅ Phase 1 — Foundation & Design System

| # | Task | Status |
|---|---|---|
| 1.1 | `create-next-app` — Next.js 16, TypeScript, Tailwind v4, App Router, src/ | ✅ Done |
| 1.2 | Install all dependencies (Prisma, NextAuth, Zustand, Framer Motion, etc.) | ✅ Done |
| 1.3 | Add DB migration npm scripts to `package.json` | ✅ Done |
| 1.4 | Spiritual design tokens — CSS variables in `globals.css` | ✅ Done |
| 1.5 | Prisma schema — all tables with MySQL provider | ✅ Done |
| 1.6 | `.env.example` — all required environment variables | ✅ Done |
| 1.7 | NextAuth.js v5 config — email + Google OAuth + role | ✅ Done |
| 1.8 | Prisma client singleton (`src/lib/prisma.ts`) | ✅ Done |
| 1.9 | Zustand player store (`src/store/playerStore.ts`) | ✅ Done |
| 1.10 | App shell — root layout, providers (Theme, Session, Player) | ✅ Done |
| 1.11 | Header component — logo, nav links, mobile hamburger | ✅ Done |
| 1.12 | Bottom tab-bar — mobile navigation | ✅ Done |
| 1.13 | Dark/light theme toggle | ✅ Done |
| 1.14 | PWA — `manifest.json` + iOS meta tags | ✅ Done |
| 1.15 | Middleware — admin route protection | ✅ Done |
| 1.16 | Data seed script — migrate v1 `libraryData.js` → Prisma | ✅ Done |

---

### ✅ Phase 2 — Home Page

| # | Task | Status |
|---|---|---|
| 2.1 | Hero section — animated Sanskrit shloka + Maha Mantra + CTA buttons | ✅ Done |
| 2.2 | Daily verse widget — DB-driven, multi-language toggle | ✅ Done |
| 2.3 | Stats strip — total audio · video · playlists · languages | ✅ Done |
| 2.4 | "Continue Listening/Watching" row — Zustand store (resumes last track) | ✅ Done |
| 2.5 | Recently Played row — Zustand history (last 20, deduped, persisted) | ✅ Done |
| 2.6 | Featured Playlists row — horizontal scroll cards | ✅ Done |
| 2.7 | Global search bar → `/api/search` → MySQL LIKE query | ✅ Done |

---

### ✅ Phase 3 — Audio Experience

| # | Task | Status |
|---|---|---|
| 3.1 | Audio library — Language cards → Category → Playlist → Track list | ✅ Done |
| 3.2 | Persistent bottom mini-player (Zustand) — survives all navigation | ✅ Done |
| 3.3 | Full-screen player drawer — waveform (canvas), all controls | ✅ Done |
| 3.4 | Speed control (0.5×–2×), sleep timer, ±15s/±30s skip | ✅ Done |
| 3.5 | Media Session API — lockscreen controls | ✅ Done |
| 3.6 | Up-Next queue with drag-to-reorder (dnd-kit) | ✅ Done |
| 3.7 | Bookmarks — save timestamp + note to `UserNote` table | ✅ Done |
| 3.8 | Resume position — localStorage (guest) → UserProgress (logged-in) | ✅ Done |

---

### ✅ Phase 4 — Video Experience

| # | Task | Status |
|---|---|---|
| 4.1 | Video library — Language → Category → Playlist → video grid | ✅ Done |
| 4.2 | Resumable YouTube IFrame player (TypeScript) | ✅ Done |
| 4.3 | Floating mini-player — fixed bottom-right 240×135px on navigation | ✅ Done |
| 4.4 | Picture-in-Picture button (native browser PiP API) | ✅ Done |
| 4.5 | Audio-only mode toggle — hide iframe, keep audio | ✅ Done |
| 4.6 | Progress % badge on video thumbnails | ✅ Done |

---

### ✅ Phase 5 — User System

| # | Task | Status |
|---|---|---|
| 5.1 | Login / Register pages — spiritual themed | ✅ Done |
| 5.2 | Google OAuth one-click login | ✅ Done |
| 5.3 | User profile — avatar, favorites count, history count | ✅ Done |
| 5.4 | Favorites — ♥ icon → `UserFavorite` + My Favorites page | ✅ Done |
| 5.5 | Notes page — all bookmarks with timestamp filter | ✅ Done |
| 5.6 | History page — full listening/watching history + clear | ✅ Done |
| 5.7 | Settings — theme, default speed, volume | ✅ Done |

---

### ✅ Phase 6 — Admin Dashboard

| # | Task | Status |
|---|---|---|
| 6.1 | Admin route guard — proxy.ts + layout server check | ✅ Done |
| 6.2 | Dashboard home — stats cards + recent activity | ✅ Done |
| 6.3 | Excel import — Audio (upload → preview → insert) | ✅ Done |
| 6.4 | Excel import — Video (same flow, YouTube ID parsed) | ✅ Done |
| 6.5 | Single-add lecture form | ✅ Done |
| 6.6 | YouTube channel sync — fetch playlists via API → diff → upsert | ✅ Done |
| 6.7 | Content management table — list / delete / paginate | ✅ Done |
| 6.8 | Articles CMS — markdown body editor | ✅ Done |
| 6.9 | Live config manager — channelId, streamUrl, autoFetch | ✅ Done |

---

### ✅ Phase 7 — Live Stream & Push Notifications

| # | Task | Status |
|---|---|---|
| 7.1 | Live page — full-width YouTube embed + auto-detection API route | ✅ Done |
| 7.2 | "Notify me when live" → Web Push VAPID subscription | ✅ Done |
| 7.3 | Cron check every 5 min → send push if live detected | ✅ Done |
| 7.4 | Upcoming programs calendar | ✅ Done |

---

### ⬜ Phase 8 — PWA (Android + iOS, No App Store)

| # | Task | Status |
|---|---|---|
| 8.1 | Native service worker config — offline shell + precache | ✅ Done |
| 8.2 | Full `manifest.json` — icons, standalone mode | ✅ Done |
| 8.3 | iOS metadata — apple-touch-icon and standalone mode | ✅ Done |
| 8.4 | Service worker — cache playlist pages + recently played | ✅ Done |
| 8.5 | Custom "Add to Home Screen" install banner | ✅ Done |
| 8.6 | Background audio via Media Session API | ✅ Done |

---

### ⬜ Phase 9 — Polish & Advanced

| # | Task | Status |
|---|---|---|
| 9.1 | Offline audio — Cache API for saved/downloaded lectures | ✅ Done |
| 9.2 | "Download lecture" button + "Available offline" badge | ✅ Done |
| 9.3 | Web Share API — share lecture link with timestamp | ✅ Done |
| 9.4 | Transcript full-text search within a lecture | ✅ Done |
| 9.5 | Auto YouTube sync — Vercel Cron daily | ⬜ Todo |
| 9.6 | Admin analytics — Chart.js most played, per-language | ⬜ Todo |
| 9.7 | Accessibility — ARIA, keyboard nav, reduced motion | ⬜ Todo |
| 9.8 | Performance — ISR for playlists, virtual scroll for long lists | ⬜ Todo |

---

## v1 Files to Port

| v1 File | Purpose in v2 |
|---|---|
| `src/utils/recentlyPlayed.js` | localStorage guest fallback |
| `src/components/AudioDetail.js` | HTML5 audio + skip/seek/resume logic |
| `src/components/ResumableYouTubePlayer.js` | IFrame API + position save |
| `src/components/Live.js` | Live detection UI |
| `api/youtube-live.js` | → Next.js `/api/youtube-live` route |
| `src/data/libraryData.js` | Source for `prisma/seed.ts` |
| `src/data/englishAudioData.generated.json` | Source for `prisma/seed.ts` |
| `src/components/About.js` | Gurudeva biography content |
| `src/components/Articles.js` | 3 articles → seed into MySQL |
| `src/config/liveConfig.json` | → `LiveConfig` table row |

---

*Last updated: Phase 6 + 7.1 complete — Phase 7 push notifications + Phase 8 PWA next*
