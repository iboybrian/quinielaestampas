// API-Football v3 wrapper — https://www.api-football.com/
// Free tier: 100 req/day. Live polling capped to every 60s.

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

async function apiFetch(endpoint, params = {}) {
  if (!API_KEY) {
    console.warn('[FootballAPI] No API key — returning mock data.')
    return null
  }
  const url = new URL(`${BASE_URL}${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  return data.response
}

// World Cup 2026 fixture ID (FIFA World Cup = league 1, season 2026)
const WC_LEAGUE = 1
const WC_SEASON = 2026

export async function getFixtures() {
  const data = await apiFetch('/fixtures', { league: WC_LEAGUE, season: WC_SEASON })
  if (!data) return MOCK_FIXTURES
  return data.map(normalizeFixture)
}

export async function getLiveFixtures() {
  const data = await apiFetch('/fixtures', { live: 'all', league: WC_LEAGUE })
  if (!data) return []
  return data.map(normalizeFixture)
}

export async function getFixtureById(id) {
  const data = await apiFetch('/fixtures', { id })
  if (!data || !data[0]) return null
  return normalizeFixture(data[0])
}

function normalizeFixture(f) {
  return {
    id: String(f.fixture.id),
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_flag: getFlagEmoji(f.teams.home.code),
    away_flag: getFlagEmoji(f.teams.away.code),
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: normalizeStatus(f.fixture.status.short),
    starts_at: f.fixture.date,
    stage: f.league.round,
    venue: f.fixture.venue.name,
  }
}

function normalizeStatus(s) {
  if (['NS', 'TBD'].includes(s)) return 'scheduled'
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(s)) return 'live'
  if (['FT', 'AET', 'PEN'].includes(s)) return 'finished'
  return 'scheduled'
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return '🏳️'
  const code = countryCode.toUpperCase()
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0)))
}

// ─── Mock data for dev without API key ──────────────────────────────────────
export const MOCK_FIXTURES = [
  { id: 'm1', home_team: 'Argentina', away_team: 'Poland', home_flag: '🇦🇷', away_flag: '🇵🇱', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-12T18:00:00Z', stage: 'Group A', venue: 'MetLife Stadium' },
  { id: 'm2', home_team: 'France', away_team: 'Morocco', home_flag: '🇫🇷', away_flag: '🇲🇦', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-12T21:00:00Z', stage: 'Group B', venue: 'SoFi Stadium' },
  { id: 'm3', home_team: 'Brazil', away_team: 'Colombia', home_flag: '🇧🇷', away_flag: '🇨🇴', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-13T18:00:00Z', stage: 'Group C', venue: 'AT&T Stadium' },
  { id: 'm4', home_team: 'Spain', away_team: 'Germany', home_flag: '🇪🇸', away_flag: '🇩🇪', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-13T21:00:00Z', stage: 'Group D', venue: 'Rose Bowl' },
  { id: 'm5', home_team: 'England', away_team: 'Mexico', home_flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', away_flag: '🇲🇽', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-14T18:00:00Z', stage: 'Group E', venue: 'Estadio Azteca' },
  { id: 'm6', home_team: 'USA', away_team: 'Canada', home_flag: '🇺🇸', away_flag: '🇨🇦', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-14T21:00:00Z', stage: 'Group F', venue: 'Levi\'s Stadium' },
  { id: 'm7', home_team: 'Portugal', away_team: 'Netherlands', home_flag: '🇵🇹', away_flag: '🇳🇱', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-15T18:00:00Z', stage: 'Group G', venue: 'Hard Rock Stadium' },
  { id: 'm8', home_team: 'Japan', away_team: 'Senegal', home_flag: '🇯🇵', away_flag: '🇸🇳', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-15T21:00:00Z', stage: 'Group H', venue: 'Allegiant Stadium' },
]

export const MOCK_BRACKET = {
  r16: [
    { id: 'r16-1', home: { team: 'Argentina', flag: '🇦🇷' }, away: { team: 'Netherlands', flag: '🇳🇱' }, homeScore: 3, awayScore: 2, status: 'finished' },
    { id: 'r16-2', home: { team: 'France', flag: '🇫🇷' }, away: { team: 'Brazil', flag: '🇧🇷' }, homeScore: 1, awayScore: 0, status: 'finished' },
    { id: 'r16-3', home: { team: 'Spain', flag: '🇪🇸' }, away: { team: 'USA', flag: '🇺🇸' }, homeScore: 2, awayScore: 1, status: 'finished' },
    { id: 'r16-4', home: { team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, away: { team: 'Portugal', flag: '🇵🇹' }, homeScore: 2, awayScore: 2, awayPenalties: 4, homePenalties: 3, status: 'finished' },
    { id: 'r16-5', home: { team: 'Germany', flag: '🇩🇪' }, away: { team: 'Japan', flag: '🇯🇵' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-01' },
    { id: 'r16-6', home: { team: 'Morocco', flag: '🇲🇦' }, away: { team: 'Colombia', flag: '🇨🇴' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-01' },
    { id: 'r16-7', home: { team: 'Mexico', flag: '🇲🇽' }, away: { team: 'Senegal', flag: '🇸🇳' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-02' },
    { id: 'r16-8', home: { team: 'Canada', flag: '🇨🇦' }, away: { team: 'Poland', flag: '🇵🇱' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-02' },
  ],
  qf: [
    { id: 'qf-1', home: { team: 'Argentina', flag: '🇦🇷' }, away: { team: 'France', flag: '🇫🇷' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-05' },
    { id: 'qf-2', home: { team: 'Spain', flag: '🇪🇸' }, away: { team: 'Portugal', flag: '🇵🇹' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-05' },
    { id: 'qf-3', home: { team: 'TBD', flag: '❓' }, away: { team: 'TBD', flag: '❓' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-06' },
    { id: 'qf-4', home: { team: 'TBD', flag: '❓' }, away: { team: 'TBD', flag: '❓' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-06' },
  ],
  sf: [
    { id: 'sf-1', home: { team: 'TBD', flag: '❓' }, away: { team: 'TBD', flag: '❓' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-10' },
    { id: 'sf-2', home: { team: 'TBD', flag: '❓' }, away: { team: 'TBD', flag: '❓' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-11' },
  ],
  final: [
    { id: 'final', home: { team: 'TBD', flag: '❓' }, away: { team: 'TBD', flag: '❓' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-19' },
  ],
  champion: null,
}
