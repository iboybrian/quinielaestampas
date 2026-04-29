import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const corsResp = handleCors(req)
  if (corsResp) return corsResp

  const origin = req.headers.get('origin')
  const headers = corsHeaders(origin)

  const payload = await req.json()
  const record     = payload.record
  const old_record = payload.old_record
  if (!record) return new Response('ok', { headers })

  // Only fire when match status transitions to 'finished'
  if (record.status !== 'finished' || old_record?.status === 'finished') {
    return new Response('ok', { headers })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get all users who predicted this match
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, home_score, away_score')
    .eq('match_id', record.id)

  if (!predictions?.length) return new Response('ok', { headers })

  const homeScore = record.home_score ?? 0
  const awayScore = record.away_score ?? 0
  const matchLabel = `${record.home_team ?? '?'} ${homeScore}-${awayScore} ${record.away_team ?? '?'}`

  const notifySendPush = (userId: string, title: string, body: string) =>
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        user_id: userId,
        title,
        body,
        url: '/quiniela',
        tag: `match-${record.id}`,
      }),
    })

  await Promise.allSettled(
    predictions.map((pred) => {
      let points = 0
      const exactHome = pred.home_score === homeScore
      const exactAway = pred.away_score === awayScore
      if (exactHome && exactAway) {
        points = 5
      } else {
        const predDiff = (pred.home_score ?? 0) - (pred.away_score ?? 0)
        const realDiff = homeScore - awayScore
        if (predDiff === realDiff) {
          points = 3
        } else {
          const predWinner = predDiff > 0 ? 'home' : predDiff < 0 ? 'away' : 'draw'
          const realWinner = realDiff > 0 ? 'home' : realDiff < 0 ? 'away' : 'draw'
          points = predWinner === realWinner ? 2 : 0
        }
      }

      const emoji = points === 5 ? '🎯' : points >= 2 ? '✅' : '❌'
      const title = `${emoji} Partido finalizado`
      const body  = `${matchLabel} — ${points > 0 ? `+${points} puntos` : 'Sin puntos'}`
      return notifySendPush(pred.user_id, title, body)
    })
  )

  return new Response('ok', { headers })
})
