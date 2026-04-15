import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculatePoints } from '../lib/scoring'

export function useMyQuinielas() {
  const { user } = useAuth()
  const [quinielas, setQuinielas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuinielas = useCallback(async () => {
    if (!user) { setQuinielas([]); setLoading(false); return }
    try {
      const { data } = await supabase
        .from('quiniela_members')
        .select('quiniela_id, quinielas(id, name, code, created_by, created_at)')
        .eq('user_id', user.id)
      setQuinielas(data?.map((r) => r.quinielas).filter(Boolean) ?? [])
    } catch { setQuinielas([]) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { fetchQuinielas() }, [fetchQuinielas])
  return { quinielas, loading, refresh: fetchQuinielas }
}

export function useQuinielaGroup(quinielaId) {
  const { user } = useAuth()
  const [quiniela, setQuiniela] = useState(null)
  const [members, setMembers] = useState([])
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!quinielaId) return
    try {
      const [{ data: q }, { data: m }, { data: p }] = await Promise.all([
        supabase.from('quinielas').select('*').eq('id', quinielaId).single(),
        supabase.from('quiniela_members').select('user_id, profiles(id, username, avatar_url)').eq('quiniela_id', quinielaId),
        supabase.from('predictions').select('*').eq('quiniela_id', quinielaId),
      ])
      setQuiniela(q)
      setMembers(m?.map((r) => r.profiles).filter(Boolean) ?? [])
      setPredictions(p ?? [])
    } catch { console.error('Failed to load quiniela group') }
    finally { setLoading(false) }
  }, [quinielaId])

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel(`quiniela-${quinielaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions', filter: `quiniela_id=eq.${quinielaId}` }, fetchData)
      .subscribe()
    return () => channel.unsubscribe()
  }, [quinielaId, fetchData])

  const savePrediction = useCallback(async (matchId, homeScore, awayScore) => {
    if (!user || !quinielaId) return
    const { error } = await supabase.from('predictions').upsert(
      { quiniela_id: quinielaId, user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore },
      { onConflict: 'quiniela_id,user_id,match_id' }
    )
    if (error) throw error
    await fetchData()
  }, [user, quinielaId, fetchData])

  const myPredictions = predictions.filter((p) => p.user_id === user?.id)
  return { quiniela, members, predictions, myPredictions, loading, savePrediction, refresh: fetchData }
}

export async function createQuiniela(name, userId) {
  const code = generateCode()
  const { data, error } = await supabase
    .from('quinielas')
    .insert({ name, code, created_by: userId })
    .select()
    .single()
  if (error) throw error
  await supabase.from('quiniela_members').insert({ quiniela_id: data.id, user_id: userId })
  return data
}

export async function joinQuiniela(code, userId) {
  const { data: q, error: qErr } = await supabase
    .from('quinielas')
    .select('*')
    .eq('code', code.toUpperCase())
    .single()
  if (qErr || !q) throw new Error('Quiniela not found. Check the code and try again.')
  const { error: mErr } = await supabase
    .from('quiniela_members')
    .insert({ quiniela_id: q.id, user_id: userId })
  if (mErr && mErr.code !== '23505') throw mErr  // 23505 = already member
  return q
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
