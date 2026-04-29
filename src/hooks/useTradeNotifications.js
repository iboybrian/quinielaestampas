import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// unreadTrades shape: { [tradeId]: { count, lastMsg, partnerUsername } }
export function useTradeNotifications() {
  const { user } = useAuth()
  const [unreadTrades, setUnreadTrades] = useState({})
  // tradePartners: { [tradeId]: { partnerId, partnerUsername } }
  const [tradePartners, setTradePartners] = useState({})
  const tradeIdsRef = useRef([])

  useEffect(() => {
    if (!user) return
    let channel

    async function setup() {
      // Fetch trades involving this user
      const { data: trades } = await supabase
        .from('trade_requests')
        .select('id, from_user, to_user')
        .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)

      if (!trades?.length) return

      tradeIdsRef.current = trades.map((t) => t.id)

      // Fetch partner profiles separately (avoids double-FK alias issues)
      const partnerIds = [...new Set(trades.map((t) => t.from_user === user.id ? t.to_user : t.from_user))]
      const { data: profilesList } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', partnerIds)
      const profilesMap = {}
      profilesList?.forEach((p) => { profilesMap[p.id] = p })

      const partners = {}
      trades.forEach((t) => {
        const partnerId = t.from_user === user.id ? t.to_user : t.from_user
        partners[t.id] = { partnerId, partnerUsername: profilesMap[partnerId]?.username ?? 'Collector' }
      })
      setTradePartners(partners)

      // Realtime: listen for new messages in any of these trades
      channel = supabase
        .channel(`trade-notifications-${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new
          if (msg.sender_id === user.id) return
          if (!tradeIdsRef.current.includes(msg.trade_id)) return
          setUnreadTrades((prev) => ({
            ...prev,
            [msg.trade_id]: {
              count: (prev[msg.trade_id]?.count ?? 0) + 1,
              lastMsg: msg.content,
              partnerUsername: partners[msg.trade_id]?.partnerUsername ?? 'Collector',
            },
          }))
        })
        .subscribe()
    }

    setup()
    return () => { channel?.unsubscribe() }
  }, [user])

  const markTradeRead = useCallback((tradeId) => {
    setUnreadTrades((prev) => {
      const next = { ...prev }
      delete next[tradeId]
      return next
    })
  }, [])

  const totalUnread = Object.values(unreadTrades).reduce((sum, t) => sum + t.count, 0)

  return { unreadTrades, tradePartners, totalUnread, markTradeRead }
}
