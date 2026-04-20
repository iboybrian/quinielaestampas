# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
```

There is no test runner and no linter configured in this project.

## Environment Setup

Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app runs without these (Supabase client falls back to placeholder values and logs a warning), but all authenticated features and database operations will fail.

## Architecture

### Provider tree
```
BrowserRouter → AuthProvider → LangProvider → App
```
- **AuthProvider** (`src/contexts/AuthContext.jsx`): Supabase auth session, `user` (raw auth object), `profile` (from `profiles` table), `signIn/signUp/signOut/updateProfile`.
- **LangProvider** (`src/contexts/LangContext.jsx`): i18n, Spanish default. `useLang()` returns `{ lang, toggle, t }` where `t` is the full translation object from `src/lib/translations.js`.

### Layout system
`App.jsx` owns `sidebarOpen` state and passes `onMenuOpen` to Navbar, `isOpen/onClose` to Sidebar. Every page is wrapped in `<PageTransition>` which applies `pt-16 pb-20 md:pb-8` padding (accounts for fixed 64px navbar top, 64px footer bottom on mobile).

- **Navbar**: hamburger + absolute-centered logo on mobile; logo-left, centered nav links, lang toggle + auth button on desktop. The `md:hidden` bottom Footer is for mobile only.
- **Sidebar**: mobile slide-out panel only, triggered by the hamburger.

### Data flow
Hooks in `src/hooks/` abstract all Supabase queries:
- `useMyQuinielas()` — user's quiniela groups
- `useQuinielaGroup(id)` — group detail + members + predictions, with a **realtime subscription** on `predictions` rows filtered by `quiniela_id`
- `useMyCollection()` — user's sticker `have/need` state from `user_stickers` table

Match data (`src/lib/footballApi.js`) is **entirely mocked** — it returns static WC2026 fixture arrays. There is no live API call at runtime. Connecting real API-Football data requires replacing the mock return values.

### Scoring
Prediction scoring is implemented **twice** and must stay in sync:
1. `src/lib/scoring.js` — client-side, used for live display in Standings/MatchCard
2. `supabase/migrations/001_initial.sql` → `score_predictions()` trigger — server-side, fires when a match row transitions `status → 'finished'`. Point values: 5 exact, 3 correct goal diff, 2 correct winner, 0 miss.

### Sticker data
All sticker definitions are client-side in `src/lib/stickerData.js` (18 teams, ~16 players each, special stickers). The database only stores which sticker IDs a user has (`user_stickers.sticker_id TEXT`). There is no sticker table in Supabase.

### Images
Custom images live in `src/public/assets/images/home/` and **must be imported as ES modules**, not referenced as static URL strings:
```js
import trophyImg from '../public/assets/images/home/trophy.png'
```
Using `/assets/...` URL paths will 404 because this folder is inside `src/`, not the root `public/`.

### i18n
Add new translatable strings to **both** `es` and `en` objects in `src/lib/translations.js`, then consume with `const { t } = useLang()`. Filter/tab values used in logic (e.g. `filter === 'Have'`) keep their English string keys — only the display labels are translated.

### Framer Motion conventions
- `useReducedMotion()` is used in `PageTransition` and `Home` to skip `y`-offset animations when the OS has "Reduce Motion" enabled.
- Continuous animations (trophy float) use `style={{ willChange: 'transform' }}` and animate only a single transform property.
- Prefer `type: 'tween', ease: 'easeOut'` over `type: 'spring'` for transitions where physics bounce is not needed.

## Database Schema (Supabase)

Tables: `profiles`, `quinielas`, `quiniela_members`, `matches`, `predictions`, `user_stickers`, `trade_requests`, `messages`.

Key behaviors:
- Profile is auto-created by the `handle_new_user` trigger on `auth.users` insert, pulling `username`/`country` from `raw_user_meta_data`.
- `predictions` has a `UNIQUE(quiniela_id, user_id, match_id)` constraint — always use `.upsert()` with `onConflict` when saving.
- Realtime is enabled on `matches`, `predictions`, `messages`, `quiniela_members`.
- RLS is enabled on all tables. The `matches` table allows any authenticated user to insert/update (no admin role implemented yet).

Run the migration by pasting `supabase/migrations/001_initial.sql` into the Supabase SQL editor — there is no CLI migration runner configured.
