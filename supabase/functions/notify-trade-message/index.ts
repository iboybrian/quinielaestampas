import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const payload = await req.json()
  // DB webhook sends { type, table, record, old_record }
  const record = payload.record
  if (!record) return new Response('ok')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get the trade to find both participants
  const { data: trade } = await supabase
    .from('trade_requests')
    .select('from_user, to_user')
    .eq('id', record.trade_id)
    .single()

  if (!trade) {
    console.error('Trade not found for trade_id:', record.trade_id)
    return new Response('ok')
  }

  // Notify the recipient (not the sender)
  const recipientId = record.sender_id === trade.from_user
    ? trade.to_user
    : trade.from_user

  // Get sender profile for display name
  const { data: sender } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', record.sender_id)
    .single()

  const senderName = sender?.username ?? 'Alguien'
  const preview = record.content?.slice(0, 80) ?? '…'

  await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({
      user_id: recipientId,
      title: `💬 ${senderName}`,
      body: preview,
      url: '/marketplace',
      tag: `chat-${record.trade_id}`,
    }),
  })

  return new Response('ok')
})
