import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { calculatePoints } from '../lib/scoring'
import { getFixtures, isGroupStage, MOCK_FIXTURES } from '../lib/footballApi'

export function useFixtures() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getFixtures()

      // Upsert group-stage fixtures to Supabase so prediction FK constraint is satisfied.
      // Strip fields not in the matches schema (home_penalties, away_penalties from API data).
      const group = all.filter(isGroupStage).map(({ id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, starts_at, stage, venue }) =>
        ({ id, home_team, away_team, home_flag, away_flag, home_score, away_score, status, starts_at, stage, venue })
      )
      if (group.length) {
        // sync-matches Edge Function uses service_role to bypass RLS, so the
        // score_predictions() trigger fires correctly when status → 'finished'.
        const { error: fnErr } = await supabase.functions.invoke('sync-matches', {
          body: { matches: group },
        })
        if (fnErr) console.error('[useFixtures] sync-matches failed:', fnErr)
      }

      setFixtures(all)
    } catch (e) {
      console.error('[useFixtures]', e)
      setFixtures(MOCK_FIXTURES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { fixtures, loading, refresh: load }
}

export function useMyQuinielas() {
  const { user } = useAuth()
  const [quinielas, setQuinielas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchQuinielas = useCallback(async () => {
    if (!user) { setQuinielas([]); setLoading(false); return }
    try {
      const { data } = await supabase
        .from('quiniela_members')
        .select('quiniela_id, role, quinielas(id, name, code, created_by, created_at)')
        .eq('user_id', user.id)
      setQuinielas(
        data?.map((r) => ({ ...r.quinielas, myRole: r.role })).filter(Boolean) ?? []
      )
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
  const [loadError, setLoadError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(async () => {
    if (!quinielaId) return
    try {
      setLoadError(null)
      const [{ data: q, error: qErr }, { data: m }, { data: p }] = await Promise.all([
        supabase.from('quinielas').select('*').eq('id', quinielaId).single(),
        supabase.from('quiniela_members')
          .select('user_id, role, has_paid, profiles(id, username, avatar_url)')
          .eq('quiniela_id', quinielaId),
        supabase.from('predictions').select('*').eq('quiniela_id', quinielaId),
      ])
      if (qErr) throw qErr
      setQuiniela(q)
      const enrichedMembers = m?.map((r) => ({
        ...r.profiles,
        role: r.role,
        hasPaid: r.has_paid,
      })).filter((r) => r.id) ?? []
      setMembers(enrichedMembers)
      setPredictions(p ?? [])
      const myMember = m?.find((r) => r.user_id === user?.id)
      setIsAdmin(myMember?.role === 'admin')
    } catch (e) {
      console.error('[useQuinielaGroup]', e)
      setLoadError(e?.message ?? 'Error loading group')
    }
    finally { setLoading(false) }
  }, [quinielaId, user])

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
  return { quiniela, members, predictions, myPredictions, loading, loadError, isAdmin, savePrediction, refresh: fetchData }
}

export async function createQuiniela(name, userId) {
  const code = generateCode()
  const { data, error } = await supabase
    .from('quinielas')
    .insert({ name, code, created_by: userId })
    .select()
    .single()
  if (error) throw error
  await supabase.from('quiniela_members').insert({ quiniela_id: data.id, user_id: userId, role: 'admin' })
  return data
}

export async function joinQuiniela(code, userId) {
  const { data: q, error: qErr } = await supabase
    .from('quinielas')
    .select('*, quiniela_members(count)')
    .eq('code', code.toUpperCase())
    .single()
  if (qErr || !q) throw new Error('Quiniela not found. Check the code and try again.')

  if (q.participant_limit != null) {
    const { count } = await supabase
      .from('quiniela_members')
      .select('*', { count: 'exact', head: true })
      .eq('quiniela_id', q.id)
    if (count >= q.participant_limit) throw new Error('This group has reached its participant limit.')
  }

  const { error: mErr } = await supabase
    .from('quiniela_members')
    .insert({ quiniela_id: q.id, user_id: userId, role: 'member' })
  if (mErr && mErr.code !== '23505') throw mErr  // 23505 = already member
  return q
}

export async function updateQuiniela(quinielaId, fields) {
  const allowed = ['name', 'prediction_deadline_minutes', 'entry_fee', 'participant_limit', 'description', 'info_contact']
  const payload = Object.fromEntries(
    Object.entries(fields).filter(([k]) => allowed.includes(k))
  )
  const { error } = await supabase.from('quinielas').update(payload).eq('id', quinielaId)
  if (error) throw error
}

export async function toggleMemberPaid(quinielaId, memberId, hasPaid) {
  const { error } = await supabase
    .from('quiniela_members')
    .update({ has_paid: hasPaid })
    .eq('quiniela_id', quinielaId)
    .eq('user_id', memberId)
  if (error) throw error
}

export async function removeMember(quinielaId, memberId) {
  const { error } = await supabase
    .from('quiniela_members')
    .delete()
    .eq('quiniela_id', quinielaId)
    .eq('user_id', memberId)
  if (error) throw error
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// Rival predictions are hidden until kickoff. Unlocks when:
// 1. API reports status 'live' or 'finished', OR
// 2. starts_at has passed (handles stale 1-hour cache where status is still 'scheduled').
function isMatchLocked(fixture) {
  if (fixture?.status === 'live' || fixture?.status === 'finished') return false
  if (fixture?.starts_at && new Date(fixture.starts_at) <= new Date()) return false
  return true
}

// Masks other users' predictions for matches that haven't started yet.
// Own predictions (currentUserId) are always returned as-is.
// Hidden predictions keep user_id/match_id so the matrix can render a lock cell.
export function maskPredictions(predictions, fixtures, currentUserId) {
  const fixtureMap = new Map(fixtures.map((f) => [f.id, f]))
  return predictions.map((p) => {
    if (p.user_id === currentUserId) return p
    const fixture = fixtureMap.get(p.match_id) ?? fixtureMap.get(String(p.match_id))
    if (!fixture) return p
    if (isMatchLocked(fixture)) {
      return { user_id: p.user_id, match_id: p.match_id, quiniela_id: p.quiniela_id, hidden: true }
    }
    return p
  })
}
