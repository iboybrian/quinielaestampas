import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ALL_STICKERS } from '../lib/stickerData'

// Parse context stored in wanting_stickers array
// Format: ['ctx_type:mercado', 'ctx_sticker:ARG-P01'] or ['ctx_type:trade']
function parseContext(wantingStickers = []) {
  const typeEntry   = wantingStickers.find((s) => s?.startsWith('ctx_type:'))
  const stickerEntry = wantingStickers.find((s) => s?.startsWith('ctx_sticker:'))
  const type      = typeEntry   ? typeEntry.replace('ctx_type:', '')    : null
  const stickerId = stickerEntry ? stickerEntry.replace('ctx_sticker:', '') : null
  const sticker   = stickerId ? ALL_STICKERS.find((s) => s.id === stickerId) ?? null : null
  return { type, sticker }
}

export function buildContextPayload(context) {
  if (!context?.type) return []
  const arr = [`ctx_type:${context.type}`]
  if (context.sticker?.id) arr.push(`ctx_sticker:${context.sticker.id}`)
  return arr
}

export function useChats() {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) { setChats([]); setLoading(false); return }

    try {
      // 1. All trade_requests for user
      const { data: trades, error: tradesErr } = await supabase
        .from('trade_requests')
        .select('id, from_user, to_user, wanting_stickers, created_at')
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)

      if (tradesErr) throw tradesErr
      if (!trades?.length) { setChats([]); setLoading(false); return }

      // 2. Partner profiles in one query
      const partnerIds = [...new Set(
        trades.map((t) => t.from_user === user.id ? t.to_user : t.from_user)
      )]
      const { data: profilesList, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, country')
        .in('id', partnerIds)
      if (profilesErr) console.error('[useChats] profiles:', profilesErr)
      const profilesMap = {}
      profilesList?.forEach((p) => { profilesMap[p.id] = p })

      // 3. Last message per trade in one query (fetch all, group in JS)
      const tradeIds = trades.map((t) => t.id)
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('trade_id, content, created_at, sender_id')
        .in('trade_id', tradeIds)
        .order('created_at', { ascending: false })
      if (msgsErr) console.error('[useChats] messages:', msgsErr)

      const lastMsgMap = {}
      msgs?.forEach((m) => {
        if (!lastMsgMap[m.trade_id]) lastMsgMap[m.trade_id] = m
      })

      // 4. Build chat list
      const list = trades
        .filter((t) => lastMsgMap[t.id]) // only trades with at least one message
        .map((t) => {
          const partnerId = t.from_user === user.id ? t.to_user : t.from_user
          return {
            tradeId:  t.id,
            partner:  profilesMap[partnerId] ?? { id: partnerId, username: 'Collector' },
            lastMsg:  lastMsgMap[t.id],
            context:  parseContext(t.wanting_stickers),
            createdAt: t.created_at,
          }
        })
        .sort((a, b) => new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at))

      setChats(list)
    } catch (e) {
      console.error('[useChats]', e)
      setChats([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  // Realtime: refresh when any message inserted in a trade of this user
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`chats-refresh-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        load()
      })
      .subscribe()
    return () => channel.unsubscribe()
  }, [user, load])

  return { chats, loading, refresh: load }
}
