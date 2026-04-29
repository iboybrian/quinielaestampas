# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
```

No test runner or linter. Expose dev server on network for mobile testing: `vite.config.js` has `host: true` — Windows Firewall may need inbound rule for port 5173.

## Environment Setup

Create `.env` in project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FOOTBALL_API_KEY=your-api-football-key   # optional — falls back to MOCK_FIXTURES
```

Without Supabase vars, all auth/DB ops fail (client logs warning). Without football API key, fixtures fall back to hardcoded `MOCK_FIXTURES` in `footballApi.js`.

`VITE_VAPID_PUBLIC_KEY` required for Web Push. Without it, `usePushNotifications` silently disables (`supported = false`).

## Architecture

### Provider tree
```
BrowserRouter → AuthProvider → LangProvider → App
```
- **AuthProvider** (`src/contexts/AuthContext.jsx`): Supabase auth session, `user` (raw auth object), `profile` (from `profiles` table), `signIn/signUp/signOut/updateProfile/resetPassword/updatePassword`. `signUp` also does direct profile upsert as fallback if DB trigger didn't fire (e.g. email confirmation enabled).
- **LangProvider** (`src/contexts/LangContext.jsx`): i18n, Spanish default. `useLang()` returns `{ lang, toggle, t }` where `t` is full translation object from `src/lib/translations.js`.

### Layout system
`App.jsx` owns `sidebarOpen` state, passes `onMenuOpen` to Navbar, `isOpen/onClose` to Sidebar. Every page wrapped in `<PageTransition>` — applies `pt-16 pb-20 md:pb-8` (fixed 64px navbar top, 64px footer bottom on mobile).

- **Navbar**: hamburger + absolute-centered logo on mobile; logo-left, centered nav links, lang toggle + auth button on desktop. `md:hidden` bottom Footer is mobile only.
- **Sidebar**: mobile slide-out panel, triggered by hamburger.

### Data flow — Supabase hooks
Hooks in `src/hooks/` abstract all Supabase queries:
- `useFixtures()` — fetches fixtures (API or mock), then **upserts group-stage rows into `matches` table**. Mandatory: `predictions.match_id` FK on `matches.id` — predictions fail with constraint error if fixtures not synced first.
- `useMyQuinielas()` — user's quiniela groups via `quiniela_members` join.
- `useQuinielaGroup(id)` — group detail + members + predictions, **realtime subscription** on `predictions` filtered by `quiniela_id`.
- `useMyCollection()` — sticker `have/need/duplicate` state from `user_stickers`. Exports `bulkUpsertStickers(ids[])` for batch ops. Also exports standalone async fns: `findDuplicateOwners(stickerId, currentUserId)` and `findTradeMatches(userId)` — module-level exports, not hook returns.
- `useChats()` — inbox of trade conversations (trades with ≥1 message), realtime refresh on `messages` INSERT. Returns `{ chats, loading, refresh }`.
- `useTradeNotifications()` — in-memory unread count per trade via realtime `messages` subscription. Returns `{ unreadTrades, tradePartners, totalUnread, markTradeRead }`. Resets on page reload (not persisted).
- `usePushNotifications()` — Web Push subscribe/unsubscribe, stores subscription in `push_subscriptions`. Requires `VITE_VAPID_PUBLIC_KEY` and `/sw.js` service worker.

### Match data — API-Football v3
`src/lib/footballApi.js` connects to API-Football (free tier: 100 req/day, league `1`, season `2026`). Responses **cached in localStorage**:
- Fixtures: 1-hour TTL (`wc_fixtures_2026_v4`)
- Stats: 7-day TTL per fixture (`wc_stats_{id}`)

Bump `CACHE_VERSION` (currently `4`) when `normalizeFixture` output shape changes — busts stale cache. Without API key, `getFixtures()` returns `MOCK_FIXTURES`.

`WC2026_GROUPS` in `footballApi.js` has all 12 groups (A–L) from Dec 5 2025 draw. `GroupsView.jsx` imports `WC2026_GROUPS` directly.

`home_flag` / `away_flag` store **lowercase ISO 3166-1 alpha-2 codes** (e.g. `'ar'`, `'gb-eng'`), not emoji. Team name → code lookup via `TEAM_TO_CODE` map in that file.

### Flags
All flag rendering uses `src/components/ui/Flag.jsx`, fetches from `flagcdn.com`:
```jsx
<Flag code="ar" size="lg" />   // sizes: xs sm md lg xl 2xl
```
Pass `null` or omit `code` for neutral placeholder. Supports subdivision codes like `gb-eng`, `gb-wls`, `gb-sct`. **Never use emoji flags** — don't render on Windows.

### Quiniela group page tabs
`QuinielaGroup.jsx` renders four tabs: **Standings → Groups → Matches → Bracket** (Bracket only when knockout fixtures exist). Groups tab has internal sub-nav: group cards view → predictions entry view (`showPredictions` state). `PredictionModal` rendered at page level to overlay all tabs.

### Marketplace tabs
`Marketplace.jsx` renders four tabs: **My Album → Trade → Mercado → Chats**.
- **My Album**: sticker grid with team/filter nav. Triggers `AchievementOverlay` on team completion or legendary sticker.
- **Trade**: `TradeMatcher` — finds users whose extras match your needs and vice versa, scored and ranked.
- **Mercado**: `DuplicateSearch` — find users with duplicates of specific sticker.
- **Chats**: `ChatInbox` — active trade conversations sorted by last message.
- `TradeChat` (slide-over panel) rendered at page level, opened from any tab via `openChat(partner, context)`.
- Unread badge on Trade and Chats tabs from `useTradeNotifications`.

### Trade chat context encoding
`trade_requests.wanting_stickers` (text[]) doubles as context carrier. Entries prefixed `ctx_type:` and `ctx_sticker:` encode which tab/sticker initiated chat. Use `buildContextPayload(context)` from `useChats.js` to build, `parseContext()` to read. Don't store real sticker IDs without prefix — treated as regular want-list entries.

### Supabase Edge Functions
Three Deno edge functions in `supabase/functions/`:
- `notify-trade-message` — DB webhook on `messages` INSERT; calls `send-push` for recipient.
- `send-push` — looks up `push_subscriptions` for `user_id`, sends Web Push via VAPID.
- `notify-match-event` — triggered on `matches` status change to notify quiniela members.

Deploy via Supabase dashboard or CLI. DB webhook for `notify-trade-message` must be configured in Supabase dashboard pointing to function URL.

### Scoring
Prediction scoring implemented **twice** — must stay in sync:
1. `src/lib/scoring.js` — client-side, live display in Standings/MatchCard. Points: 5 exact score, 3 correct goal diff, 2 correct winner, 0 miss.
2. `supabase/migrations/001_initial.sql` → `score_predictions()` trigger — server-side, fires when `matches.status` → `'finished'`.

### Sticker data
All sticker definitions client-side in `src/lib/stickerData.js` (16 teams, ~16 players each + specials). Each team has: `code` (3-letter FIFA, e.g. `'ARG'`) used as sticker ID prefix, `isoCode` (2-letter ISO, e.g. `'ar'`) used with `Flag`. DB only stores sticker IDs (`user_stickers.sticker_id TEXT`) — no sticker table in Supabase.

### Images
Custom images in `public/assets/images/home/` (root `public/`, NOT `src/public/`). Reference via URL string:
```js
const trophyImg = '/assets/images/home/trophy.png'
```
Root `public/` files served as-is by Vite at `/` in dev and prod. Vercel serves from `dist/`.

### i18n
Add new strings to **both** `es` and `en` in `src/lib/translations.js`, access via `const { t } = useLang()`. Filter/tab values used in logic (e.g. `filter === 'Have'`) keep English string keys — only display labels translated.

### Tailwind class safety
Tailwind purges unused classes at build. **Never construct class names with template literals** for color/variant names:
```js
// BAD  — purged at build
`border-${color}-400/20`
// GOOD — full strings preserved
{ border: 'border-amber-400/20', text: 'text-amber-400' }
```

### Framer Motion conventions
- `useReducedMotion()` used in `PageTransition` and `Home` to skip `y`-offset animations.
- Prefer CSS `@keyframes` (via Tailwind `animate-*`) over Framer Motion for always-on looping — more reliable on initial mount.
- Prefer `type: 'tween', ease: 'easeOut'` over `type: 'spring'` when physics bounce not needed.

## Database Schema (Supabase)

Tables: `profiles`, `quinielas`, `quiniela_members`, `matches`, `predictions`, `user_stickers`, `trade_requests`, `messages`, `push_subscriptions`.

Key behaviors:
- Profile auto-created by `handle_new_user` trigger on `auth.users` insert, pulls `username`/`country` from `raw_user_meta_data`.
- `predictions` has `UNIQUE(quiniela_id, user_id, match_id)` — always use `.upsert()` with `onConflict: 'quiniela_id,user_id,match_id'`.
- Realtime enabled on `matches`, `predictions`, `messages`, `quiniela_members`.
- RLS enabled on all tables. `matches` allows any authenticated user to insert/update (no admin role yet).

Run migrations by pasting SQL into Supabase SQL editor in order (`001_initial.sql`, `002_admin_features.sql`, `003_push_subscriptions.sql`) — no CLI runner configured. Migration 003 adds `push_subscriptions` for Web Push.
