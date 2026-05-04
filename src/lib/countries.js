// Countries list shared across the app (signup form, profile flag rendering, etc.)
// `code` is the ISO 3166-1 alpha-2 code used by flagcdn.com (lowercase).
// Subdivision codes like 'gb-eng', 'gb-sct', 'gb-wls' supported.

export const COUNTRIES = [
  { code: 'al', name: 'Albania' },       { code: 'dz', name: 'Algeria' },        { code: 'ao', name: 'Angola' },
  { code: 'ar', name: 'Argentina' },     { code: 'am', name: 'Armenia' },        { code: 'au', name: 'Australia' },
  { code: 'at', name: 'Austria' },       { code: 'az', name: 'Azerbaijan' },     { code: 'bh', name: 'Bahrain' },
  { code: 'bd', name: 'Bangladesh' },    { code: 'be', name: 'Belgium' },        { code: 'bo', name: 'Bolivia' },
  { code: 'ba', name: 'Bosnia & Herzegovina' }, { code: 'br', name: 'Brazil' }, { code: 'bg', name: 'Bulgaria' },
  { code: 'cm', name: 'Cameroon' },      { code: 'ca', name: 'Canada' },         { code: 'cl', name: 'Chile' },
  { code: 'cn', name: 'China' },         { code: 'co', name: 'Colombia' },       { code: 'cr', name: 'Costa Rica' },
  { code: 'hr', name: 'Croatia' },       { code: 'cu', name: 'Cuba' },           { code: 'cz', name: 'Czech Republic' },
  { code: 'cd', name: 'DR Congo' },      { code: 'dk', name: 'Denmark' },        { code: 'ec', name: 'Ecuador' },
  { code: 'eg', name: 'Egypt' },         { code: 'sv', name: 'El Salvador' },    { code: 'gb-eng', name: 'England' },
  { code: 'fi', name: 'Finland' },       { code: 'fr', name: 'France' },         { code: 'de', name: 'Germany' },
  { code: 'gh', name: 'Ghana' },         { code: 'gr', name: 'Greece' },         { code: 'gt', name: 'Guatemala' },
  { code: 'hn', name: 'Honduras' },      { code: 'hu', name: 'Hungary' },        { code: 'id', name: 'Indonesia' },
  { code: 'ir', name: 'Iran' },          { code: 'iq', name: 'Iraq' },           { code: 'ie', name: 'Ireland' },
  { code: 'il', name: 'Israel' },        { code: 'it', name: 'Italy' },          { code: 'ci', name: 'Ivory Coast' },
  { code: 'jm', name: 'Jamaica' },       { code: 'jp', name: 'Japan' },          { code: 'jo', name: 'Jordan' },
  { code: 'kz', name: 'Kazakhstan' },    { code: 'ke', name: 'Kenya' },          { code: 'kw', name: 'Kuwait' },
  { code: 'mx', name: 'Mexico' },        { code: 'ma', name: 'Morocco' },        { code: 'nl', name: 'Netherlands' },
  { code: 'nz', name: 'New Zealand' },   { code: 'ng', name: 'Nigeria' },        { code: 'no', name: 'Norway' },
  { code: 'om', name: 'Oman' },          { code: 'pa', name: 'Panama' },         { code: 'py', name: 'Paraguay' },
  { code: 'pe', name: 'Peru' },          { code: 'ph', name: 'Philippines' },    { code: 'pl', name: 'Poland' },
  { code: 'pt', name: 'Portugal' },      { code: 'qa', name: 'Qatar' },          { code: 'ro', name: 'Romania' },
  { code: 'ru', name: 'Russia' },        { code: 'sa', name: 'Saudi Arabia' },   { code: 'gb-sct', name: 'Scotland' },
  { code: 'sn', name: 'Senegal' },       { code: 'rs', name: 'Serbia' },         { code: 'sk', name: 'Slovakia' },
  { code: 'si', name: 'Slovenia' },      { code: 'za', name: 'South Africa' },   { code: 'kr', name: 'South Korea' },
  { code: 'es', name: 'Spain' },         { code: 'se', name: 'Sweden' },         { code: 'ch', name: 'Switzerland' },
  { code: 'tn', name: 'Tunisia' },       { code: 'tr', name: 'Turkey' },         { code: 'ae', name: 'UAE' },
  { code: 'ua', name: 'Ukraine' },       { code: 'us', name: 'United States' },  { code: 'uy', name: 'Uruguay' },
  { code: 've', name: 'Venezuela' },     { code: 'gb-wls', name: 'Wales' },      { code: 'ye', name: 'Yemen' },
  { code: 'zm', name: 'Zambia' },        { code: 'zw', name: 'Zimbabwe' },
]

const NAME_TO_CODE = Object.fromEntries(
  COUNTRIES.map(({ name, code }) => [name.toLowerCase(), code])
)

// Country names stored in DB are the human-readable strings from COUNTRIES.name.
// Returns the matching ISO code or null if unknown / nullish input.
export function countryNameToCode(name) {
  if (!name) return null
  return NAME_TO_CODE[name.toLowerCase()] ?? null
}
