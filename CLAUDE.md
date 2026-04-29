# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
```

No test runner or linter is configured. To expose the dev server on the local network (for mobile testing): `vite.config.js` already has `host: true` — Windows Firewall may need an inbound rule for port 5173.

## Environment Setup

Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FOOTBALL_API_KEY=your-api-football-key   # optional — falls back to MOCK_FIXTURES
```

Without Supabase vars, all auth and DB operations fail (client logs a warning). Without the football API key, fixtures fall back to hardcoded `MOCK_FIXTURES` in `footballApi.js`.

`VITE_VAPID_PUBLIC_KEY` is required for Web Push. Without it, `usePushNotifications` silently disables itself (`supported = false`).

## Architecture

### Provider tree
```
BrowserRouter → AuthProvider → LangProvider → App
```
- **AuthProvider** (`src/contexts/AuthContext.jsx`): Supabase auth session, `user` (raw auth object), `profile` (from `profiles` table), `signIn/signUp/signOut/updateProfile/resetPassword/updatePassword`. `signUp` also does a direct profile upsert as fallback in case the DB trigger didn't fire (e.g. email confirmation enabled).
- **LangProvider** (`src/contexts/LangContext.jsx`): i18n, Spanish default. `useLang()` returns `{ lang, toggle, t }` where `t` is the full translation object from `src/lib/translations.js`.

### Layout system
`App.jsx` owns `sidebarOpen` state and passes `onMenuOpen` to Navbar, `isOpen/onClose` to Sidebar. Every page is wrapped in `<PageTransition>` which applies `pt-16 pb-20 md:pb-8` padding (accounts for fixed 64px navbar top, 64px footer bottom on mobile).

- **Navbar**: hamburger + absolute-centered logo on mobile; logo-left, centered nav links, lang toggle + auth button on desktop. The `md:hidden` bottom Footer is for mobile only.
- **Sidebar**: mobile slide-out panel only, triggered by the hamburger.

### Data flow — Supabase hooks
Hooks in `src/hooks/` abstract all Supabase queries:
- `useFixtures()` — fetches match fixtures (API or mock), then **upserts group-stage rows into the `matches` Supabase table**. This upsert is mandatory: `predictions.match_id` has a FK on `matches.id`, so predictions will fail with a constraint error if fixtures haven't been synced first.
- `useMyQuinielas()` — user's quiniela groups via `quiniela_members` join.
- `useQuinielaGroup(id)` — group detail + members + predictions, with a **realtime subscription** on `predictions` rows filtered by `quiniela_id`.
- `useMyCollection()` — user's sticker `have/need/duplicate` state from `user_stickers` table. Exports `bulkUpsertStickers(ids[])` for batch operations. Also exports two standalone async functions: `findDuplicateOwners(stickerId, currentUserId)` and `findTradeMatches(userId)` — both are module-level exports, not hook returns.
- `useChats()` — inbox of all trade conversations (trades with ≥1 message), with realtime refresh on `messages` INSERT. Returns `{ chats, loading, refresh }`.
- `useTradeNotifications()` — in-memory unread count per trade, populated via realtime `messages` subscription. Returns `{ unreadTrades, tradePartners, totalUnread, markTradeRead }`. State resets on page reload (not persisted).
- `usePushNotifications()` — Web Push subscribe/unsubscribe, stores subscription in `push_subscriptions` table. Requires `VITE_VAPID_PUBLIC_KEY` and `/sw.js` service worker.

### Match data — API-Football v3
`src/lib/footballApi.js` connects to API-Football (free tier: 100 req/day, league `1`, season `2022` for testing). All responses are **cached in localStorage**:
- Fixtures: 1-hour TTL (`wc_fixtures_2022_v3`)
- Stats: 7-day TTL per fixture (`wc_stats_{id}`)

Bump `CACHE_VERSION` (currently `3`) when `normalizeFixture`'s output shape changes — this busts all stale cached data. Without an API key, `getFixtures()` returns `MOCK_FIXTURES`.

`home_flag` / `away_flag` fields on fixtures store **lowercase ISO 3166-1 alpha-2 codes** (e.g. `'ar'`, `'gb-eng'`), not emoji. Team name → code lookup is via the `TEAM_TO_CODE` map in that file.

### Flags
All flag rendering uses `src/components/ui/Flag.jsx`, which fetches images from `flagcdn.com`:
```jsx
<Flag code="ar" size="lg" />   // sizes: xs sm md lg xl 2xl
```
Pass `null` or omit `code` to render a neutral placeholder. Supports subdivision codes like `gb-eng`, `gb-wls`, `gb-sct`. **Never use emoji flags** — they don't render on Windows.

### Quiniela group page tabs
`QuinielaGroup.jsx` renders four tabs: **Standings → Groups → Matches → Bracket** (Bracket only appears when knockout fixtures exist). The Groups tab has internal sub-navigation: group cards view → predictions entry view (`showPredictions` state). `PredictionModal` is rendered at the page level so it overlays all tabs.

### Marketplace tabs
`Marketplace.jsx` renders four tabs: **My Album → Trade → Mercado → Chats**.
- **My Album**: sticker collection grid with team/filter navigation. Triggers `AchievementOverlay` on team completion or legendary sticker.
- **Trade**: `TradeMatcher` — finds users whose extras match your needs and vice versa, scored and ranked.
- **Mercado**: `DuplicateSearch` — find users with duplicates of a specific sticker.
- **Chats**: `ChatInbox` — all active trade conversations sorted by last message.
- `TradeChat` (slide-over panel) is rendered at page level and opened from any tab via `openChat(partner, context)`.
- Unread badge on Trade and Chats tabs comes from `useTradeNotifications`.

### Trade chat context encoding
`trade_requests.wanting_stickers` (text[]) doubles as a context carrier. Entries prefixed `ctx_type:` and `ctx_sticker:` encode which tab/sticker initiated the chat. Use `buildContextPayload(context)` from `useChats.js` to build and `parseContext()` to read. Do not store real sticker IDs in this field without the prefix — they'll be treated as regular sticker want-list entries.

### Supabase Edge Functions
Three Deno edge functions in `supabase/functions/`:
- `notify-trade-message` — triggered by DB webhook on `messages` INSERT; calls `send-push` for the recipient.
- `send-push` — looks up `push_subscriptions` for a `user_id`, sends Web Push via VAPID.
- `notify-match-event` — triggered on `matches` status change (presumably to notify quiniela members).

Deploy via Supabase dashboard or CLI. The DB webhook for `notify-trade-message` must be configured in the Supabase dashboard pointing to the function URL.

### Scoring
Prediction scoring is implemented **twice** and must stay in sync:
1. `src/lib/scoring.js` — client-side, used for live display in Standings/MatchCard. Point values: 5 exact score, 3 correct goal diff, 2 correct winner, 0 miss.
2. `supabase/migrations/001_initial.sql` → `score_predictions()` trigger — server-side, fires when `matches.status` transitions to `'finished'`.

### Sticker data
All sticker definitions are client-side in `src/lib/stickerData.js` (16 teams, ~16 players each + special stickers). Each team has two code fields: `code` (3-letter FIFA, e.g. `'ARG'`) used as the sticker ID prefix, and `isoCode` (2-letter ISO, e.g. `'ar'`) used with the `Flag` component. The database only stores which sticker IDs a user has (`user_stickers.sticker_id TEXT`) — no sticker table in Supabase.

### Images
Custom images live in `public/assets/images/home/` (root-level `public/`, NOT `src/public/`). Reference via URL string — no ES module import needed:
```js
const trophyImg = '/assets/images/home/trophy.png'
```
Files in root `public/` are served as-is by Vite at `/` in both dev and prod. Vercel serves them correctly from `dist/`.

### i18n
Add new strings to **both** `es` and `en` objects in `src/lib/translations.js`, then access via `const { t } = useLang()`. Filter/tab values used in logic (e.g. `filter === 'Have'`) keep their English string keys — only display labels are translated.

### Tailwind class safety
Tailwind purges unused classes at build time. **Never construct class names with template literals** for color/variant names:
```js
// BAD  — purged at build
`border-${color}-400/20`
// GOOD — full strings preserved
{ border: 'border-amber-400/20', text: 'text-amber-400' }
```

### Framer Motion conventions
- `useReducedMotion()` is used in `PageTransition` and `Home` to skip `y`-offset animations.
- Prefer CSS `@keyframes` animations (via Tailwind `animate-*` classes) over Framer Motion for always-on looping animations — more reliable on initial mount.
- Prefer `type: 'tween', ease: 'easeOut'` over `type: 'spring'` when physics bounce is not needed.

## Database Schema (Supabase)

Tables: `profiles`, `quinielas`, `quiniela_members`, `matches`, `predictions`, `user_stickers`, `trade_requests`, `messages`, `push_subscriptions`.

Key behaviors:
- Profile is auto-created by the `handle_new_user` trigger on `auth.users` insert, pulling `username`/`country` from `raw_user_meta_data`.
- `predictions` has a `UNIQUE(quiniela_id, user_id, match_id)` constraint — always use `.upsert()` with `onConflict: 'quiniela_id,user_id,match_id'` when saving.
- Realtime is enabled on `matches`, `predictions`, `messages`, `quiniela_members`.
- RLS is enabled on all tables. The `matches` table allows any authenticated user to insert/update (no admin role implemented yet).

Run migrations by pasting SQL files into the Supabase SQL editor in order (`001_initial.sql`, `002_admin_features.sql`, `003_push_subscriptions.sql`) — no CLI migration runner is configured. Migration 003 adds the `push_subscriptions` table for Web Push.
