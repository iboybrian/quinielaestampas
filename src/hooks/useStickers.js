import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMyCollection() {
  const { user } = useAuth()
  const [collection, setCollection] = useState({}) // { stickerId: { quantity, is_needed } }
  const [loading, setLoading] = useState(true)

  const fetchCollection = useCallback(async () => {
    if (!user) { setCollection({}); setLoading(false); return }
    try {
      const { data } = await supabase
        .from('user_stickers')
        .select('sticker_id, quantity, is_needed')
        .eq('user_id', user.id)
      const map = {}
      data?.forEach((s) => { map[s.sticker_id] = { quantity: s.quantity, isNeeded: s.is_needed } })
      setCollection(map)
    } catch { setCollection({}) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchCollection() }, [fetchCollection])

  const toggleHave = useCallback(async (stickerId) => {
    if (!user) return
    const current = collection[stickerId]
    if (current && current.quantity > 0) {
      // Remove
      await supabase.from('user_stickers').delete().eq('user_id', user.id).eq('sticker_id', stickerId)
      setCollection((prev) => { const n = { ...prev }; delete n[stickerId]; return n })
    } else {
      // Add
      await supabase.from('user_stickers').upsert(
        { user_id: user.id, sticker_id: stickerId, quantity: 1, is_needed: false },
        { onConflict: 'user_id,sticker_id' }
      )
      setCollection((prev) => ({ ...prev, [stickerId]: { quantity: 1, isNeeded: false } }))
    }
  }, [user, collection])

  const toggleNeed = useCallback(async (stickerId) => {
    if (!user) return
    const current = collection[stickerId]
    const newNeed = !current?.isNeeded
    await supabase.from('user_stickers').upsert(
      { user_id: user.id, sticker_id: stickerId, quantity: current?.quantity ?? 0, is_needed: newNeed },
      { onConflict: 'user_id,sticker_id' }
    )
    setCollection((prev) => ({ ...prev, [stickerId]: { ...prev[stickerId], isNeeded: newNeed, quantity: prev[stickerId]?.quantity ?? 0 } }))
  }, [user, collection])

  const hasSticker = (id) => Boolean(collection[id]?.quantity > 0)
  const needsSticker = (id) => Boolean(collection[id]?.isNeeded)

  const bulkUpsertStickers = useCallback(async (stickerIds) => {
    if (!user || !stickerIds.length) return false
    const rows = stickerIds.map((id) => ({
      user_id: user.id,
      sticker_id: id,
      quantity: 1,
      is_needed: false,
    }))
    const { error } = await supabase
      .from('user_stickers')
      .upsert(rows, { onConflict: 'user_id,sticker_id' })
    if (!error) {
      setCollection((prev) => {
        const next = { ...prev }
        stickerIds.forEach((id) => {
          next[id] = { quantity: 1, isNeeded: prev[id]?.isNeeded ?? false }
        })
        return next
      })
    }
    return !error
  }, [user])

  const stats = {
    owned: Object.values(collection).filter((s) => s.quantity > 0).length,
    needed: Object.values(collection).filter((s) => s.isNeeded).length,
  }

  return { collection, loading, toggleHave, toggleNeed, hasSticker, needsSticker, bulkUpsertStickers, stats, refresh: fetchCollection }
}

export async function findTradeMatches(userId) {
  // Get what I need
  const { data: myNeeds } = await supabase
    .from('user_stickers')
    .select('sticker_id')
    .eq('user_id', userId)
    .eq('is_needed', true)

  // Get what I have extras of (quantity > 1)
  const { data: myExtras } = await supabase
    .from('user_stickers')
    .select('sticker_id')
    .eq('user_id', userId)
    .gt('quantity', 1)

  if (!myNeeds?.length || !myExtras?.length) return []

  const needIds = myNeeds.map((s) => s.sticker_id)
  const extraIds = myExtras.map((s) => s.sticker_id)

  // Find users who have what I need
  const { data: haveWhatINeed } = await supabase
    .from('user_stickers')
    .select('user_id, sticker_id')
    .in('sticker_id', needIds)
    .gt('quantity', 0)
    .neq('user_id', userId)

  // Find users who need what I have
  const { data: needWhatIHave } = await supabase
    .from('user_stickers')
    .select('user_id, sticker_id')
    .in('sticker_id', extraIds)
    .eq('is_needed', true)
    .neq('user_id', userId)

  // Score by overlap
  const scoreMap = {}
  haveWhatINeed?.forEach(({ user_id }) => { scoreMap[user_id] = (scoreMap[user_id] || 0) + 1 })
  needWhatIHave?.forEach(({ user_id }) => { scoreMap[user_id] = (scoreMap[user_id] || 0) + 1 })

  const topUserIds = Object.entries(scoreMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id)

  if (!topUserIds.length) return []

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, country')
    .in('id', topUserIds)

  return profiles?.map((p) => ({ ...p, matchScore: scoreMap[p.id] || 0 })) ?? []
}
