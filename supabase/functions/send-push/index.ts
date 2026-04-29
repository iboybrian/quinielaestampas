import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'
import { handleCors, corsHeaders } from '../_shared/cors.ts'

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

serve(async (req) => {
  const corsResp = handleCors(req)
  if (corsResp) return corsResp

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const origin = req.headers.get('origin')
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' }

  const { user_id, title, body, url, tag } = await req.json()
  if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400, headers })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (error) {
    console.error('DB error:', error)
    return new Response(JSON.stringify({ sent: 0, error: error.message }), { headers })
  }

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers })
  }

  const payload = JSON.stringify({ title, body, url: url ?? '/', tag: tag ?? 'wc2026' })

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 86400 }
      )
    )
  )

  // Remove expired/invalid subscriptions (410 = gone, 404 = not found)
  const expiredEndpoints = results
    .map((r, i) => ({ r, endpoint: subs[i].endpoint }))
    .filter(({ r }) => {
      if (r.status !== 'rejected') return false
      const code = r.reason?.statusCode
      return code === 410 || code === 404
    })
    .map(({ endpoint }) => endpoint)

  if (expiredEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints)
  }

  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`Push failed [${subs[i].endpoint.slice(-20)}]:`, r.reason)
  })

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return new Response(JSON.stringify({ sent, total: subs.length }), { headers })
})
