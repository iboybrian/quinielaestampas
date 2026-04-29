export const ALLOWED_ORIGINS = [
  'https://quinielaestampas.com',
  'https://www.quinielaestampas.com',
  'http://localhost:5173',
]

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

// Returns a preflight response for OPTIONS, null otherwise.
export function handleCors(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}
