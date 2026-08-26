## Plan: User Portal Professional UI Overhaul

Preserve the existing Vani Samputa brand palette and typography, but introduce a unified user-facing visual system (surfaces, inputs, cards, chips, empty states, iconography, spacing rhythm) and apply it through shared layout/components first so all user pages gain a consistent, premium look with minimal regression risk.

**Steps**
1. Phase 1 - Foundations: add user-facing semantic UI utilities in c:/React Project/vani-samputa-temp/src/app/globals.css (user shell background, page surface container, card/panel styles, input/select/textarea styles, filter chip styles, section spacing utilities, subtle motion rules, focus-visible rings).
2. Phase 1 - Shell integration (*depends on 1*): update c:/React Project/vani-samputa-temp/src/app/layout.tsx to wrap non-admin content in a consistent content surface and improve vertical rhythm; keep current player/footer spacing behavior intact.
3. Phase 1 - Navigation polish (*depends on 1*): refactor c:/React Project/vani-samputa-temp/src/components/Header.tsx and c:/React Project/vani-samputa-temp/src/components/BottomTabBar.tsx to use the same surface depth, active state treatment, and icon sizing/weight conventions.
4. Phase 2 - Shared high-traffic components (*depends on 1-3*): modernize c:/React Project/vani-samputa-temp/src/components/home/SearchBar.tsx, c:/React Project/vani-samputa-temp/src/components/home/HeroSection.tsx, c:/React Project/vani-samputa-temp/src/components/home/StatsStrip.tsx, c:/React Project/vani-samputa-temp/src/components/home/ContinueListening.tsx, c:/React Project/vani-samputa-temp/src/components/home/RecentlyPlayed.tsx, c:/React Project/vani-samputa-temp/src/components/home/FeaturedPlaylists.tsx, c:/React Project/vani-samputa-temp/src/components/home/DailyVerseWidget.tsx using shared classes (remove per-file hardcoded surface/input/button styles).
5. Phase 2 - Media list/detail components (*parallel with step 4 after step 1*): align c:/React Project/vani-samputa-temp/src/components/audio/PlaylistTrackList.tsx, c:/React Project/vani-samputa-temp/src/components/video/VideoGrid.tsx, c:/React Project/vani-samputa-temp/src/components/LivePageClient.tsx to the shared card/chip/empty-state language and professional control styling.
6. Phase 3 - Route template pass (*depends on 4-5*): standardize page-level wrappers, heading blocks, filters, chips, and list containers across c:/React Project/vani-samputa-temp/src/app/page.tsx, c:/React Project/vani-samputa-temp/src/app/audio/page.tsx, c:/React Project/vani-samputa-temp/src/app/video/page.tsx, c:/React Project/vani-samputa-temp/src/app/lectures/page.tsx, c:/React Project/vani-samputa-temp/src/app/articles/page.tsx, c:/React Project/vani-samputa-temp/src/app/events/page.tsx, c:/React Project/vani-samputa-temp/src/app/about/page.tsx, c:/React Project/vani-samputa-temp/src/app/live/page.tsx.
7. Phase 3 - Language and playlist pages (*depends on 6*): align c:/React Project/vani-samputa-temp/src/app/audio/[language]/page.tsx, c:/React Project/vani-samputa-temp/src/app/video/[language]/page.tsx, c:/React Project/vani-samputa-temp/src/app/audio/playlist/[id]/page.tsx, c:/React Project/vani-samputa-temp/src/app/video/playlist/[id]/page.tsx, c:/React Project/vani-samputa-temp/src/app/articles/[slug]/page.tsx with consistent filters, media cards, body typography, and spacing.
8. Phase 4 - Account/auth pages (*depends on 1, can run in parallel with 6-7*): standardize c:/React Project/vani-samputa-temp/src/app/login/page.tsx, c:/React Project/vani-samputa-temp/src/app/register/page.tsx, c:/React Project/vani-samputa-temp/src/app/profile/page.tsx, c:/React Project/vani-samputa-temp/src/app/settings/page.tsx, c:/React Project/vani-samputa-temp/src/app/favorites/page.tsx, c:/React Project/vani-samputa-temp/src/app/history/page.tsx, c:/React Project/vani-samputa-temp/src/app/notes/page.tsx with professional form controls, panel depth, and empty-state design.
9. Phase 4 - Icon consistency (*depends on 3-8*): standardize user-facing icons to lucide-react (already present in project) for consistent stroke style and accessibility labeling; phase out phosphor-react usage in user-side files only.
10. Phase 5 - Accessibility + responsiveness hardening (*depends on all prior phases*): ensure keyboard focus visibility, touch target sizes, contrast checks in both light/dark themes, and mobile layout correctness for narrow widths.
11. Phase 5 - Cleanup and consolidation (*depends on all prior phases*): remove remaining inline style duplication where covered by shared utilities and keep only brand-specific exceptions (hero/illustration accents).

**Relevant files**
- c:/React Project/vani-samputa-temp/src/app/globals.css — add reusable user-side UI utility classes and light/dark tuning.
- c:/React Project/vani-samputa-temp/src/app/layout.tsx — apply consistent shell/surface wrapper for user routes.
- c:/React Project/vani-samputa-temp/src/components/Header.tsx — unify nav and control styling system.
- c:/React Project/vani-samputa-temp/src/components/BottomTabBar.tsx — improve mobile nav visual consistency and active states.
- c:/React Project/vani-samputa-temp/src/components/home/SearchBar.tsx — fix input/background mismatch and dropdown quality.
- c:/React Project/vani-samputa-temp/src/components/home/HeroSection.tsx — refine top-of-home visual hierarchy and CTA consistency.
- c:/React Project/vani-samputa-temp/src/components/home/StatsStrip.tsx — align card/surface treatment with new design system.
- c:/React Project/vani-samputa-temp/src/components/home/ContinueListening.tsx — align media card style and control affordances.
- c:/React Project/vani-samputa-temp/src/components/home/RecentlyPlayed.tsx — align cards/icons/hover language.
- c:/React Project/vani-samputa-temp/src/components/home/FeaturedPlaylists.tsx — align playlist card treatment and badges.
- c:/React Project/vani-samputa-temp/src/components/home/DailyVerseWidget.tsx — align tab chips/surface and typography spacing.
- c:/React Project/vani-samputa-temp/src/components/audio/PlaylistTrackList.tsx — align track list controls and row hierarchy.
- c:/React Project/vani-samputa-temp/src/components/video/VideoGrid.tsx — align video cards and inline player control UI.
- c:/React Project/vani-samputa-temp/src/components/LivePageClient.tsx — align live status and empty-state treatment.
- c:/React Project/vani-samputa-temp/src/app/audio/page.tsx — language card styling consistency.
- c:/React Project/vani-samputa-temp/src/app/video/page.tsx — language card styling consistency.
- c:/React Project/vani-samputa-temp/src/app/lectures/page.tsx — filter chips and list container styling.
- c:/React Project/vani-samputa-temp/src/app/articles/page.tsx — article cards, heading, and empty state consistency.
- c:/React Project/vani-samputa-temp/src/app/events/page.tsx — event card hierarchy and empty-state polish.
- c:/React Project/vani-samputa-temp/src/app/about/page.tsx — section cards and CTA consistency.
- c:/React Project/vani-samputa-temp/src/app/login/page.tsx — professional auth card + inputs + actions.
- c:/React Project/vani-samputa-temp/src/app/register/page.tsx — professional auth card + inputs + actions.
- c:/React Project/vani-samputa-temp/src/app/profile/page.tsx — profile stats + quick links panel consistency.
- c:/React Project/vani-samputa-temp/src/app/settings/page.tsx — settings sections and controls consistency.
- c:/React Project/vani-samputa-temp/src/app/favorites/page.tsx — list row and empty-state consistency.
- c:/React Project/vani-samputa-temp/src/app/history/page.tsx — list row and empty-state consistency.
- c:/React Project/vani-samputa-temp/src/app/notes/page.tsx — note card and metadata consistency.

**Verification**
1. Run npx tsc --noEmit and confirm no type errors.
2. Run npm run lint and confirm no newly introduced lint errors (existing unrelated warnings are acceptable if unchanged).
3. Manually validate desktop and mobile layouts for: Home, Audio, Video, Lectures, Articles, Events, About, Live, Login, Register, Profile, Settings.
4. Manually validate input contrast and focus states on Search, Login/Register forms, and filter chips in light and dark themes.
5. Validate hover/active/selected states are visually consistent across nav, chips, cards, and CTA buttons.
6. Validate no user-flow regressions: search navigation, playlist open/play, live page actions, auth flows, and profile/history/notes loading.

**Decisions**
- Recommended direction: keep brand palette and typography; improve polish through systemization, not rebranding.
- Recommended icon strategy: standardize user side on lucide-react for consistency with the updated admin system.
- Include: UI/UX consistency, visual hierarchy, spacing, state styling, accessibility affordances.
- Exclude: backend/data-model changes, player logic behavior changes, API contract changes.

**Further Considerations**
1. Motion density recommendation: use subtle transitions (150-220ms) globally; reserve larger animations for hero only.
2. Card density recommendation: use compact rows for history/favorites/notes and medium density for discovery cards to balance scan speed and elegance.
3. Performance recommendation: keep image/iframe usage lazy where possible and avoid adding heavyweight UI libraries for this pass.
