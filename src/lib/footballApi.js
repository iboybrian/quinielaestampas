// API-Football v3 — https://www.api-football.com/
// Free tier: 100 req/day. All responses cached in localStorage (1-hour TTL).

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY
const BASE_URL = 'https://v3.football.api-sports.io'

export const WC_LEAGUE = 1
export const WC_SEASON = 2022   // using 2022 for testing (free-tier compatible)

// ── Cache ─────────────────────────────────────────────────────────────────────
const FIXTURES_TTL = 60 * 60 * 1000  // 1 hour

function getCached(key, ttlMs) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > ttlMs) return null
    return data
  } catch { return null }
}

function setCached(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function apiFetch(endpoint, params = {}) {
  if (!API_KEY) {
    console.warn('[FootballAPI] No API key — using mock data.')
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
  const json = await res.json()
  return json.response
}

// ── Team name → flagcdn.com ISO code ─────────────────────────────────────────
// Keys are lowercased for case-insensitive lookup
const TEAM_TO_CODE = {
  'qatar':                  'qa',
  'ecuador':                'ec',
  'senegal':                'sn',
  'netherlands':            'nl',
  'england':                'gb-eng',
  'ir iran':                'ir',
  'iran':                   'ir',
  'usa':                    'us',
  'united states':          'us',
  'wales':                  'gb-wls',
  'argentina':              'ar',
  'saudi arabia':           'sa',
  'mexico':                 'mx',
  'poland':                 'pl',
  'france':                 'fr',
  'australia':              'au',
  'denmark':                'dk',
  'tunisia':                'tn',
  'spain':                  'es',
  'costa rica':             'cr',
  'germany':                'de',
  'japan':                  'jp',
  'belgium':                'be',
  'canada':                 'ca',
  'morocco':                'ma',
  'croatia':                'hr',
  'brazil':                 'br',
  'serbia':                 'rs',
  'switzerland':            'ch',
  'cameroon':               'cm',
  'portugal':               'pt',
  'ghana':                  'gh',
  'uruguay':                'uy',
  'south korea':            'kr',
  'korea republic':         'kr',
  'republic of korea':      'kr',
  'colombia':               'co',
  'scotland':               'gb-sct',
  'nigeria':                'ng',
  'ivory coast':            'ci',
  "côte d'ivoire":          'ci',
  'egypt':                  'eg',
  'algeria':                'dz',
  'ghana':                  'gh',
  'mali':                   'ml',
  'kenya':                  'ke',
  'south africa':           'za',
  'turkey':                 'tr',
  'russia':                 'ru',
  'ukraine':                'ua',
  'italy':                  'it',
  'greece':                 'gr',
  'sweden':                 'se',
  'norway':                 'no',
  'finland':                'fi',
  'austria':                'at',
  'hungary':                'hu',
  'czech republic':         'cz',
  'czechia':                'cz',
  'slovakia':               'sk',
  'slovenia':               'si',
  'romania':                'ro',
  'bulgaria':               'bg',
  'china':                  'cn',
  'china pr':               'cn',
  'indonesia':              'id',
  'philippines':            'ph',
  'thailand':               'th',
  'vietnam':                'vn',
  'india':                  'in',
  'pakistan':               'pk',
  'bangladesh':             'bd',
  'new zealand':            'nz',
  'peru':                   'pe',
  'chile':                  'cl',
  'bolivia':                'bo',
  'venezuela':              've',
  'paraguay':               'py',
  'panama':                 'pa',
  'honduras':               'hn',
  'el salvador':            'sv',
  'guatemala':              'gt',
  'cuba':                   'cu',
  'jamaica':                'jm',
  'haiti':                  'ht',
  'trinidad and tobago':    'tt',
  'iraq':                   'iq',
  'jordan':                 'jo',
  'kuwait':                 'kw',
  'bahrain':                'bh',
  'oman':                   'om',
  'uae':                    'ae',
  'united arab emirates':   'ae',
  'israel':                 'il',
  'armenia':                'am',
  'azerbaijan':             'az',
  'kazakhstan':             'kz',
  'zambia':                 'zm',
  'zimbabwe':               'zw',
  'angola':                 'ao',
  'dr congo':               'cd',
  'democratic republic of the congo': 'cd',
  'ireland':                'ie',
  'northern ireland':       'gb-nir',
  'albania':                'al',
  'bosnia & herzegovina':   'ba',
  'bosnia and herzegovina': 'ba',
  'bosnia-herzegovina':     'ba',
}

function teamToCode(teamName) {
  if (!teamName) return null
  return TEAM_TO_CODE[teamName.toLowerCase()] ?? null
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Bump this when the shape of normalizeFixture changes to bust stale caches
const CACHE_VERSION = 3

export async function getFixtures() {
  const CACHE_KEY = `wc_fixtures_${WC_SEASON}_v${CACHE_VERSION}`
  const cached = getCached(CACHE_KEY, FIXTURES_TTL)
  if (cached) return cached

  const data = await apiFetch('/fixtures', { league: WC_LEAGUE, season: WC_SEASON })
  const fixtures = data ? data.map(normalizeFixture) : MOCK_FIXTURES
  if (data) setCached(CACHE_KEY, fixtures)
  return fixtures
}

export async function getLiveFixtures() {
  const data = await apiFetch('/fixtures', { live: 'all', league: WC_LEAGUE })
  if (!data) return []
  return data.map(normalizeFixture)
}

export async function getFixtureById(id) {
  const data = await apiFetch('/fixtures', { id })
  if (!data?.[0]) return null
  return normalizeFixture(data[0])
}

export async function getFixtureStats(fixtureId) {
  const CACHE_KEY = `wc_stats_${fixtureId}`
  // Finished match stats never change — cache for 7 days
  const cached = getCached(CACHE_KEY, 7 * 24 * 60 * 60 * 1000)
  if (cached) return cached

  const data = await apiFetch('/fixtures/statistics', { fixture: fixtureId })
  if (!data || data.length < 2) return null

  const normalize = (teamData) => {
    const stats = {}
    teamData.statistics.forEach(({ type, value }) => { stats[type] = value })
    return { team: teamData.team.name, stats }
  }

  const result = { home: normalize(data[0]), away: normalize(data[1]) }
  setCached(CACHE_KEY, result)
  return result
}

// ── Stage helpers ─────────────────────────────────────────────────────────────
export function isGroupStage(fixture) {
  return fixture.stage?.toLowerCase().includes('group')
}

export function isKnockoutStage(fixture) {
  return !isGroupStage(fixture)
}

// ── Bracket normalization (for knockout view) ─────────────────────────────────
export function normalizeBracket(allFixtures) {
  const knockout = allFixtures.filter(isKnockoutStage)

  const byRound = (keyword) =>
    knockout
      .filter((f) => f.stage?.toLowerCase().includes(keyword))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
      .map(toBracketMatch)

  const r16   = byRound('round of 16')
  const qf    = byRound('quarter')
  const sf    = byRound('semi')
  // "Final" only — filter out "Semi-finals" and "3rd Place Final"
  const final = knockout
    .filter((f) => f.stage?.toLowerCase() === 'final')
    .map(toBracketMatch)

  let champion = null
  if (final[0]?.status === 'finished') {
    const m = final[0]
    if (m.homeScore > m.awayScore) {
      champion = m.home.team
    } else if (m.awayScore > m.homeScore) {
      champion = m.away.team
    } else if (m.homePenalties != null && m.awayPenalties != null) {
      // Penalty shootout (e.g. Argentina 4–2 France, WC2022 final)
      champion = m.homePenalties > m.awayPenalties ? m.home.team : m.away.team
    }
  }

  return { r16, qf, sf, final, champion }
}

function toBracketMatch(f) {
  return {
    id: f.id,
    home: { team: f.home_team, flag: f.home_flag },
    away: { team: f.away_team, flag: f.away_flag },
    homeScore: f.home_score,
    awayScore: f.away_score,
    homePenalties: f.home_penalties ?? null,
    awayPenalties: f.away_penalties ?? null,
    status: f.status,
    date: f.starts_at?.split('T')[0],
  }
}

// ── Normalise ─────────────────────────────────────────────────────────────────
function normalizeFixture(f) {
  return {
    id: String(f.fixture.id),
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    home_flag: teamToCode(f.teams.home.name),
    away_flag: teamToCode(f.teams.away.name),
    home_score: f.goals.home,
    away_score: f.goals.away,
    // Penalty scores (null unless match went to a shootout)
    home_penalties: f.score?.penalty?.home ?? null,
    away_penalties: f.score?.penalty?.away ?? null,
    status: normalizeStatus(f.fixture.status.short),
    starts_at: f.fixture.date,
    stage: f.league.round,
    venue: f.fixture.venue?.name ?? '',
  }
}

function normalizeStatus(s) {
  if (['NS', 'TBD'].includes(s)) return 'scheduled'
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(s)) return 'live'
  if (['FT', 'AET', 'PEN'].includes(s)) return 'finished'
  return 'scheduled'
}

// ── WC 2022 group data — hardcoded to save API calls ─────────────────────────
export const WC2022_GROUPS = [
  { letter: 'A', teams: [
    { name: 'Qatar',       code: 'qa' },
    { name: 'Ecuador',     code: 'ec' },
    { name: 'Senegal',     code: 'sn' },
    { name: 'Netherlands', code: 'nl' },
  ]},
  { letter: 'B', teams: [
    { name: 'England', code: 'gb-eng' },
    { name: 'Iran',    code: 'ir'     },
    { name: 'USA',     code: 'us'     },
    { name: 'Wales',   code: 'gb-wls' },
  ]},
  { letter: 'C', teams: [
    { name: 'Argentina',    code: 'ar' },
    { name: 'Saudi Arabia', code: 'sa' },
    { name: 'Mexico',       code: 'mx' },
    { name: 'Poland',       code: 'pl' },
  ]},
  { letter: 'D', teams: [
    { name: 'France',    code: 'fr' },
    { name: 'Australia', code: 'au' },
    { name: 'Denmark',   code: 'dk' },
    { name: 'Tunisia',   code: 'tn' },
  ]},
  { letter: 'E', teams: [
    { name: 'Spain',      code: 'es' },
    { name: 'Costa Rica', code: 'cr' },
    { name: 'Germany',    code: 'de' },
    { name: 'Japan',      code: 'jp' },
  ]},
  { letter: 'F', teams: [
    { name: 'Belgium', code: 'be' },
    { name: 'Canada',  code: 'ca' },
    { name: 'Morocco', code: 'ma' },
    { name: 'Croatia', code: 'hr' },
  ]},
  { letter: 'G', teams: [
    { name: 'Brazil',      code: 'br' },
    { name: 'Serbia',      code: 'rs' },
    { name: 'Switzerland', code: 'ch' },
    { name: 'Cameroon',    code: 'cm' },
  ]},
  { letter: 'H', teams: [
    { name: 'Portugal',    code: 'pt' },
    { name: 'Ghana',       code: 'gh' },
    { name: 'Uruguay',     code: 'uy' },
    { name: 'South Korea', code: 'kr' },
  ]},
  // WC 2026 groups — draw pending
  { letter: 'I', teams: null },
  { letter: 'J', teams: null },
  { letter: 'K', teams: null },
  { letter: 'L', teams: null },
]

// ── Mock data (fallback when no API key) ──────────────────────────────────────
export const MOCK_FIXTURES = [
  { id: 'm1', home_team: 'Argentina', away_team: 'Poland',      home_flag: 'ar', away_flag: 'pl', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-12T18:00:00Z', stage: 'Group Stage - 1', venue: 'MetLife Stadium' },
  { id: 'm2', home_team: 'France',    away_team: 'Morocco',     home_flag: 'fr', away_flag: 'ma', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-12T21:00:00Z', stage: 'Group Stage - 1', venue: 'SoFi Stadium' },
  { id: 'm3', home_team: 'Brazil',    away_team: 'Colombia',    home_flag: 'br', away_flag: 'co', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-13T18:00:00Z', stage: 'Group Stage - 1', venue: 'AT&T Stadium' },
  { id: 'm4', home_team: 'Spain',     away_team: 'Germany',     home_flag: 'es', away_flag: 'de', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-13T21:00:00Z', stage: 'Group Stage - 1', venue: 'Rose Bowl' },
  { id: 'm5', home_team: 'England',   away_team: 'Mexico',      home_flag: 'gb-eng', away_flag: 'mx', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-14T18:00:00Z', stage: 'Group Stage - 1', venue: 'Estadio Azteca' },
  { id: 'm6', home_team: 'USA',       away_team: 'Canada',      home_flag: 'us', away_flag: 'ca', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-14T21:00:00Z', stage: 'Group Stage - 1', venue: "Levi's Stadium" },
  { id: 'm7', home_team: 'Portugal',  away_team: 'Netherlands', home_flag: 'pt', away_flag: 'nl', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-15T18:00:00Z', stage: 'Group Stage - 1', venue: 'Hard Rock Stadium' },
  { id: 'm8', home_team: 'Japan',     away_team: 'Senegal',     home_flag: 'jp', away_flag: 'sn', home_score: null, away_score: null, status: 'scheduled', starts_at: '2026-06-15T21:00:00Z', stage: 'Group Stage - 1', venue: 'Allegiant Stadium' },
]

export const MOCK_BRACKET = {
  r16: [
    { id: 'r16-1', home: { team: 'Argentina',  flag: 'ar'     }, away: { team: 'Netherlands', flag: 'nl'     }, homeScore: 3,    awayScore: 2,    status: 'finished' },
    { id: 'r16-2', home: { team: 'France',     flag: 'fr'     }, away: { team: 'Brazil',      flag: 'br'     }, homeScore: 1,    awayScore: 0,    status: 'finished' },
    { id: 'r16-3', home: { team: 'Spain',      flag: 'es'     }, away: { team: 'USA',         flag: 'us'     }, homeScore: 2,    awayScore: 1,    status: 'finished' },
    { id: 'r16-4', home: { team: 'England',    flag: 'gb-eng' }, away: { team: 'Portugal',    flag: 'pt'     }, homeScore: 2,    awayScore: 2,    awayPenalties: 4, homePenalties: 3, status: 'finished' },
    { id: 'r16-5', home: { team: 'Germany',    flag: 'de'     }, away: { team: 'Japan',       flag: 'jp'     }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-01' },
    { id: 'r16-6', home: { team: 'Morocco',    flag: 'ma'     }, away: { team: 'Colombia',    flag: 'co'     }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-01' },
    { id: 'r16-7', home: { team: 'Mexico',     flag: 'mx'     }, away: { team: 'Senegal',     flag: 'sn'     }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-02' },
    { id: 'r16-8', home: { team: 'Canada',     flag: 'ca'     }, away: { team: 'Poland',      flag: 'pl'     }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-02' },
  ],
  qf: [
    { id: 'qf-1', home: { team: 'Argentina', flag: 'ar' }, away: { team: 'France',   flag: 'fr' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-05' },
    { id: 'qf-2', home: { team: 'Spain',     flag: 'es' }, away: { team: 'Portugal', flag: 'pt' }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-05' },
    { id: 'qf-3', home: { team: 'TBD',       flag: null }, away: { team: 'TBD',      flag: null }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-06' },
    { id: 'qf-4', home: { team: 'TBD',       flag: null }, away: { team: 'TBD',      flag: null }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-06' },
  ],
  sf: [
    { id: 'sf-1', home: { team: 'TBD', flag: null }, away: { team: 'TBD', flag: null }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-10' },
    { id: 'sf-2', home: { team: 'TBD', flag: null }, away: { team: 'TBD', flag: null }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-11' },
  ],
  final: [
    { id: 'final', home: { team: 'TBD', flag: null }, away: { team: 'TBD', flag: null }, homeScore: null, awayScore: null, status: 'scheduled', date: '2026-07-19' },
  ],
  champion: null,
}
