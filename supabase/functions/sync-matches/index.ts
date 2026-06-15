import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://quinielaestampas.com',
  'https://www.quinielaestampas.com',
  'http://localhost:5173',
]

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-client-info, apikey',
  }
}

const VALID_STATUSES = new Set(['scheduled', 'live', 'finished'])

serve(async (req) => {
  const origin = req.headers.get('origin')
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' }

  // Verify caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: { user }, error: authErr } = await adminClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

  const body = await req.json().catch(() => null)
  if (!body?.matches || !Array.isArray(body.matches)) {
    return new Response(JSON.stringify({ error: 'Missing matches array' }), { status: 400, headers })
  }

  // Sanitize — only known fields and valid status values
  const sanitized = body.matches.map((m: Record<string, unknown>) => ({
    id:         String(m.id),
    home_team:  String(m.home_team ?? ''),
    away_team:  String(m.away_team ?? ''),
    home_flag:  String(m.home_flag ?? ''),
    away_flag:  String(m.away_flag ?? ''),
    home_score: m.home_score != null ? Number(m.home_score) : null,
    away_score: m.away_score != null ? Number(m.away_score) : null,
    status:     VALID_STATUSES.has(String(m.status)) ? String(m.status) : 'scheduled',
    starts_at:  String(m.starts_at ?? ''),
    stage:      String(m.stage ?? ''),
    venue:      String(m.venue ?? ''),
  }))

  // Fetch already-finished match IDs so we never downgrade their status
  // (stale client cache could send 'scheduled' for a match already done in DB)
  const { data: finishedRows } = await adminClient
    .from('matches')
    .select('id')
    .eq('status', 'finished')
    .in('id', sanitized.map((m) => m.id))

  const finishedIds = new Set((finishedRows ?? []).map((r) => r.id))

  const safeUpsert = sanitized.map((m) =>
    finishedIds.has(m.id) ? { ...m, status: 'finished' } : m
  )

  const { error: upsertErr } = await adminClient
    .from('matches')
    .upsert(safeUpsert, { onConflict: 'id' })

  if (upsertErr) {
    console.error('[sync-matches] upsert failed:', upsertErr)
    return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500, headers })
  }

  return new Response(JSON.stringify({ synced: sanitized.length }), { status: 200, headers })
})
