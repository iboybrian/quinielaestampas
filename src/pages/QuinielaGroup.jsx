import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Loader2, Clock, Users, Phone, EyeOff, Trophy, Settings, Ticket, Coins, RefreshCw, Lock, Zap } from 'lucide-react'
import { useQuinielaGroup, useFixtures, maskPredictions } from '../hooks/useQuiniela'
import { useAuth } from '../contexts/AuthContext'
import { isKnockoutStage, isExtraPointsStage, normalizeBracket, MOCK_BRACKET, clearFixturesCache } from '../lib/footballApi'
import { useLang } from '../contexts/LangContext'
import { rankMembers, getPointsBreakdown } from '../lib/scoring'
import Standings from '../components/quiniela/Standings'
import RankChangeNotification from '../components/animations/RankChangeNotification'
import AchievementOverlay from '../components/animations/AchievementOverlay'
import GroupsView from '../components/quiniela/GroupsView'
import PredictionsView from '../components/quiniela/PredictionsView'
import MatchesView from '../components/quiniela/MatchesView'
import BracketView from '../components/quiniela/BracketView'
import ResultsMatrix from '../components/quiniela/ResultsMatrix'
import PredictionModal from '../components/quiniela/PredictionModal'
import PageTransition from '../components/layout/PageTransition'
import AdminFeatureModal from '../components/ui/AdminFeatureModal'

// Phase rank — used to zero out predictions beyond close_at_phase
const CLOSE_PHASE_RANK = { r16: 2, qf: 3, sf: 4, final: 5 }
function getStageRank(stage) {
  const s = stage ?? ''
  if (/group/i.test(s))              return 0
  if (/round of 32|r32/i.test(s))    return 1
  if (/round of 16|r16/i.test(s))    return 2
  if (/quarter/i.test(s))            return 3
  if (/semi/i.test(s))               return 4
  if (/^final$/i.test(s.trim()))     return 5
  return 0
}

export default function QuinielaGroup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const { user } = useAuth()
  const { quiniela, members, predictions, myPredictions, loading, loadError, isAdmin, savePrediction, refresh: fetchData } = useQuinielaGroup(id)
  const { fixtures, loading: fixturesLoading, refresh: refreshFixtures } = useFixtures()

  // Mask other users' predictions for matches whose deadline hasn't passed yet.
  // myPredictions stays unmasked for editing/MatchCard. visiblePredictions goes to Matrix/Standings.
  const visiblePredictions = useMemo(
    () => maskPredictions(predictions, fixtures, user?.id),
    [predictions, fixtures, user?.id]
  )

  // Override points_earned from DB (DEFAULT 0, never updated by trigger) with
  // client-side calculation. Null for unfinished/hidden so Standings counts correctly.
  // When close_at_phase is set, matches beyond that phase rank as null (don't count).
  const enrichedPredictions = useMemo(() => {
    const fixtureMap = new Map(fixtures.map((f) => [String(f.id), f]))
    const extraEnabled = quiniela?.extra_points_enabled ?? false
    const closeRank = quiniela?.close_at_phase ? (CLOSE_PHASE_RANK[quiniela.close_at_phase] ?? 99) : 99
    return visiblePredictions.map((p) => {
      if (p.hidden) return p
      const fix = fixtureMap.get(String(p.match_id))
      if (!fix || fix.status !== 'finished') return { ...p, points_earned: null }
      if (getStageRank(fix.stage) > closeRank) return { ...p, points_earned: null }
      const { base, extra, total } = getPointsBreakdown(p, fix, extraEnabled)
      return { ...p, points_earned: total, base_points: base, extra_points: extra }
    })
  }, [visiblePredictions, fixtures, quiniela?.extra_points_enabled, quiniela?.close_at_phase])

  const myEnrichedPredictions = useMemo(() => {
    const fixtureMap = new Map(fixtures.map((f) => [String(f.id), f]))
    const extraEnabled = quiniela?.extra_points_enabled ?? false
    const closeRank = quiniela?.close_at_phase ? (CLOSE_PHASE_RANK[quiniela.close_at_phase] ?? 99) : 99
    return myPredictions.map((p) => {
      const fix = fixtureMap.get(String(p.match_id))
      if (!fix || fix.status !== 'finished') return { ...p, points_earned: null }
      if (getStageRank(fix.stage) > closeRank) return { ...p, points_earned: null }
      const { base, extra, total } = getPointsBreakdown(p, fix, extraEnabled)
      return { ...p, points_earned: total, base_points: base, extra_points: extra }
    })
  }, [myPredictions, fixtures, quiniela?.extra_points_enabled, quiniela?.close_at_phase])

  const hiddenMatchCount = useMemo(
    () => fixtures.filter((f) => f.status === 'scheduled' || f.status === 'not_started').length,
    [fixtures]
  )

  // Determine if quiniela is closed (all matches in close_at_phase are finished)
  const quinielaClosed = useMemo(() => {
    const phase = quiniela?.close_at_phase
    if (!phase) return false
    const stageMatch = {
      r16:   (s) => /round of 16|r16/i.test(s ?? ''),
      qf:    (s) => /quarter/i.test(s ?? ''),
      sf:    (s) => /semi/i.test(s ?? ''),
      final: (s) => /^final$/i.test((s ?? '').trim()),
    }[phase]
    if (!stageMatch) return false
    const phaseFixtures = fixtures.filter((f) => stageMatch(f.stage))
    return phaseFixtures.length > 0 && phaseFixtures.every((f) => f.status === 'finished')
  }, [quiniela?.close_at_phase, fixtures])

  // Winner: #1 ranked member once quiniela is closed
  const winnerMember = useMemo(() => {
    if (!quinielaClosed || members.length === 0) return null
    return rankMembers(members, enrichedPredictions)[0] ?? null
  }, [quinielaClosed, members, enrichedPredictions])

  const [winnerOverlay, setWinnerOverlay] = useState(null)
  const winnerShownRef = useRef(false)
  useEffect(() => {
    if (!quinielaClosed || !winnerMember || winnerShownRef.current) return
    const key = `winner_seen_${id}`
    if (localStorage.getItem(key)) return
    winnerShownRef.current = true
    setWinnerOverlay({
      type: 'quiniela_winner',
      title: winnerMember.username ?? 'Ganador',
      description: quiniela?.name ?? '',
    })
  }, [quinielaClosed, winnerMember, id, quiniela?.name])

  const [activeTab, setActiveTab] = useState('Standings')
  const [showPredictions, setShowPredictions] = useState(false)
  const [predModal, setPredModal] = useState({ open: false, match: null })
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Rank-change notification — detected once per mount, shown on first Standings visit
  const [pendingRankChange, setPendingRankChange] = useState(null)
  const [activeRankChange, setActiveRankChange] = useState(null)
  const rankCheckedRef = useRef(false)

  useEffect(() => {
    if (rankCheckedRef.current || !user || members.length === 0 || fixturesLoading) return
    rankCheckedRef.current = true

    const memberStats = members.map((m) => {
      const preds = enrichedPredictions.filter((p) => p.user_id === m.id)
      return {
        ...m,
        totalPoints: preds.reduce((s, p) => s + (p.points_earned || 0), 0),
        exact:   preds.filter((p) => (p.base_points ?? p.points_earned) === 5).length,
        correct: preds.filter((p) => (p.base_points ?? p.points_earned) >= 2).length,
        played:  preds.filter((p) => p.points_earned !== null).length,
      }
    })
    const ranked = rankMembers(memberStats)
    const myIndex = ranked.findIndex((m) => m.id === user.id)
    if (myIndex === -1) return
    const myCurrentRank = myIndex + 1

    const storageKey = `rankSeen_${id}_${user.id}`
    const stored = localStorage.getItem(storageKey)
    const prevRank = stored ? parseInt(stored, 10) : null

    // Always persist current rank so the NEXT visit can detect the next change
    localStorage.setItem(storageKey, String(myCurrentRank))

    if (prevRank !== null && prevRank !== myCurrentRank) {
      setPendingRankChange({
        direction: myCurrentRank < prevRank ? 'up' : 'down',
        positions: Math.abs(prevRank - myCurrentRank),
        newRank: myCurrentRank,
        prevRank,
      })
    }
  }, [members, enrichedPredictions, fixturesLoading, user, id])

  // Fire the overlay when user lands on (or switches to) Standings tab
  useEffect(() => {
    if (activeTab === 'Standings' && pendingRankChange) {
      setActiveRankChange(pendingRankChange)
      setPendingRankChange(null)
    }
  }, [activeTab, pendingRankChange])

  const handleRankChangeDismiss = useCallback(() => setActiveRankChange(null), [])

  const hasKnockouts = fixtures.some(isKnockoutStage)
  const realBracket = hasKnockouts ? normalizeBracket(fixtures) : null
  // Use real bracket if it has any round data, else fall back to MOCK_BRACKET
  const bracketHasData = realBracket && (
    (realBracket.r32?.length ?? 0) > 0 ||
    (realBracket.r16?.length ?? 0) > 0 ||
    (realBracket.qf?.length ?? 0) > 0
  )
  const bracket = bracketHasData ? realBracket : MOCK_BRACKET

  const TABS = [
    { key: 'Standings', label: `🏆 ${lang === 'es' ? 'Posiciones' : 'Standings'}` },
    { key: 'Matrix',    label: `📊 ${lang === 'es' ? 'Matriz' : 'Matrix'}` },
    { key: 'Groups',    label: `⚽ ${t.quiniela.groupsTab}` },
    { key: 'Matches',   label: `📋 ${t.quiniela.matchesTab}` },
    { key: 'Bracket',  label: `🌳 ${t.quiniela.bracketTab}` },
  ]

  const copyCode = () => {
    if (!quiniela?.code) return
    navigator.clipboard.writeText(quiniela.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closePhaseRank = quiniela?.close_at_phase ? (CLOSE_PHASE_RANK[quiniela.close_at_phase] ?? 99) : 99
  const predictableFixtures = useMemo(
    () => fixtures.filter((f) => getStageRank(f.stage) <= closePhaseRank),
    [fixtures, closePhaseRank]
  )

  const openPredict  = (match) => {
    if (getStageRank(match?.stage) > closePhaseRank) return
    setPredModal({ open: true, match })
  }
  const closePredict = () => setPredModal({ open: false, match: null })
  const handleSave   = async (matchId, home, away, extras = {}) => { await savePrediction(matchId, home, away, extras) }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    clearFixturesCache()
    await Promise.all([refreshFixtures(), fetchData()])
    setRefreshing(false)
  }, [refreshFixtures, fetchData])

  const handleTabChange = (key) => {
    setActiveTab(key)
    setShowPredictions(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          {t.quiniela.loadingGroup}
        </div>
      </PageTransition>
    )
  }

  if (loadError) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500 flex-col gap-3">
          <p className="text-sm text-red-400">{t.quiniela.errorLoadGroup}</p>
          <button onClick={() => window.location.reload()} className="text-xs text-slate-500 underline">
            {lang === 'es' ? 'Recargar' : 'Reload'}
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back link */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/quiniela')}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {lang === 'es' ? 'Volver' : 'Back'}
        </motion.button>

        {/* Hero card — compact */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-3.5 mb-4 shadow-xl"
        >
          {/* Decorative trophy watermark */}
          <div className="absolute -top-6 -right-6 opacity-[0.05] pointer-events-none">
            <Trophy className="w-28 h-28 text-amber-400" strokeWidth={1.5} />
          </div>

          {/* Title row */}
          <div className="relative flex items-center justify-between gap-3 mb-2.5">
            <div className="flex-1 min-w-0 flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-black text-white truncate tracking-tight">
                {quiniela?.name ?? 'Group'}
              </h1>
              {quiniela?.code && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    {lang === 'es' ? 'Código' : 'Code'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-300">{quiniela.code}</span>
                  {copied
                    ? <Check className="w-2.5 h-2.5 text-emerald-400" />
                    : <Copy className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-200 transition-colors" />}
                </motion.button>
              )}
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                title={lang === 'es' ? 'Actualizar datos' : 'Refresh data'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </motion.button>
              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => navigate(`/quiniela/${id}/manage`)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                  title={t.quiniela.manage}
                >
                  <Settings className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Description */}
          {quiniela?.description && (
            <p className="relative text-xs text-slate-300 leading-relaxed mb-2.5">
              {quiniela.description}
            </p>
          )}

          {/* Stats grid — 4 col on desktop, 2 col mobile */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-1.5 mb-2.5">
            {quiniela?.entry_fee != null && quiniela.entry_fee !== '' && quiniela.entry_fee !== 0 && (
              <>
                <StatCard
                  icon={Ticket}
                  color="amber"
                  value={`Q${quiniela.entry_fee}`}
                  label={lang === 'es' ? 'Cuota' : 'Entry fee'}
                />
                <StatCard
                  icon={Coins}
                  color="emerald"
                  value={`Q${(Number(quiniela.entry_fee) || 0) * members.length}`}
                  label={lang === 'es' ? 'Pozo' : 'Prize pool'}
                />
              </>
            )}
            {quiniela?.prediction_deadline_minutes != null && (
              <StatCard
                icon={Clock}
                color="sky"
                value={`${formatDeadline(quiniela.prediction_deadline_minutes)} ${lang === 'es' ? 'antes' : 'before'}`}
                label={lang === 'es' ? 'Cierre predicción' : 'Pred lock'}
              />
            )}
            <StatCard
              icon={Users}
              color="violet"
              value={
                quiniela?.participant_limit
                  ? `${members.length}/${quiniela.participant_limit}`
                  : `${members.length}`
              }
              label={lang === 'es' ? 'Participantes' : 'Players'}
            />
            <StatCard
              icon={Lock}
              color="sky"
              labelFirst
              label={lang === 'es' ? 'Fase de cierre' : 'Close phase'}
              value={({ r16: lang === 'es' ? 'Octavos' : 'R16', qf: lang === 'es' ? 'Cuartos' : 'QF', sf: lang === 'es' ? 'Semis' : 'SF', final: 'Final' })[quiniela?.close_at_phase] ?? (lang === 'es' ? 'Completa' : 'Full')}
            />
            <StatCard
              icon={Zap}
              color={quiniela?.extra_points_enabled ? 'amber' : 'slate'}
              labelFirst
              label={lang === 'es' ? 'Puntos Extra' : 'Extra Points'}
              value={quiniela?.extra_points_enabled ? (lang === 'es' ? 'Activo' : 'Active') : (lang === 'es' ? 'Inactivo' : 'Inactive')}
            />
          </div>

          {/* Members + contact in single row */}
          <div className="relative flex items-center justify-between gap-3 flex-wrap text-xs">
            {members.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {members.slice(0, 7).map((m, i) => (
                    <div
                      key={m.id}
                      className="w-5 h-5 rounded-full border border-slate-900 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-300 overflow-hidden"
                      style={{ zIndex: 8 - i }}
                      title={m.username}
                    >
                      {m.avatar_url
                        ? <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" />
                        : (m.username?.[0] ?? '?').toUpperCase()}
                    </div>
                  ))}
                  {members.length > 7 && (
                    <div
                      className="w-5 h-5 rounded-full border border-slate-900 bg-amber-500/20 flex items-center justify-center text-[8px] font-bold text-amber-300"
                      style={{ zIndex: 0 }}
                      title={`+${members.length - 7}`}
                    >
                      +{members.length - 7}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">
                  {members.length === 1
                    ? (lang === 'es' ? '1 miembro' : '1 member')
                    : `${members.length} ${lang === 'es' ? 'miembros' : 'members'}`}
                </span>
              </div>
            )}
            {quiniela?.info_contact && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 min-w-0">
                <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{quiniela.info_contact}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (showPredictions ? '-pred' : '-groups')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'Standings' && (
              <>
                {hiddenMatchCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-slate-800/60 border border-white/8 text-xs text-slate-400">
                    <EyeOff className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                    <span>
                      {t.quiniela.predsHiddenAlert
                        .split('{count}')
                        .reduce((prev, current, i) => {
                          if (i === 0) return [current]
                          return [
                            ...prev,
                            <span key={i} className="text-slate-300 font-semibold">{hiddenMatchCount}</span>,
                            current.replace('{matchOrMatches}', hiddenMatchCount === 1 ? t.quiniela.matchSingle : t.quiniela.matchPlural)
                          ]
                        }, [])}
                    </span>
                  </div>
                )}
                {quinielaClosed && winnerMember && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-yellow-500/5 p-5 text-center"
                  >
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">
                      {t.quiniela_winner?.closedPhase?.[quiniela?.close_at_phase] ?? t.quiniela_winner?.closed}
                    </p>
                    <p className="text-xl font-black text-white">{winnerMember.username ?? 'Ganador'}</p>
                    <p className="text-xs text-amber-400/70 font-semibold mt-0.5">{t.quiniela_winner?.champion}</p>
                  </motion.div>
                )}
                <Standings quinielaId={id} members={members} predictions={enrichedPredictions} />
              </>
            )}

            {activeTab === 'Matrix' && (
              fixturesLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t.quiniela.loadingFixtures}
                </div>
              ) : (
                <>
                  {hiddenMatchCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-slate-800/60 border border-white/8 text-xs text-slate-400">
                      <EyeOff className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                      <span>
                        {t.quiniela.predsHiddenAlertMatrix
                          .split('{count}')
                          .reduce((prev, current, i) => {
                            if (i === 0) return [current]
                            return [
                              ...prev,
                              <span key={i} className="text-slate-300 font-semibold">{hiddenMatchCount}</span>,
                              current.replace('{matchOrMatches}', hiddenMatchCount === 1 ? t.quiniela.matchSingle : t.quiniela.matchPlural)
                            ]
                          }, [])}
                      </span>
                    </div>
                  )}
                  <ResultsMatrix members={members} predictions={enrichedPredictions} fixtures={fixtures} />
                </>
              )
            )}

            {activeTab === 'Groups' && !showPredictions && (
              <GroupsView onMakePredictions={() => setShowPredictions(true)} t={t} />
            )}

            {activeTab === 'Groups' && showPredictions && (
              fixturesLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t.quiniela.loadingFixtures}
                </div>
              ) : (
                <PredictionsView
                  fixtures={predictableFixtures}
                  myPredictions={myEnrichedPredictions}
                  onBack={() => setShowPredictions(false)}
                  onPredict={openPredict}
                  t={t}
                  scrollToDate={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()}
                  deadlineMinutes={quiniela?.prediction_deadline_minutes ?? 10}
                  extraPointsEnabled={quiniela?.extra_points_enabled ?? false}
                />
              )
            )}

            {activeTab === 'Matches' && (
              fixturesLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t.quiniela.loadingFixtures}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setActiveTab('Groups'); setShowPredictions(true) }}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-base transition-colors mb-6"
                  >
                    ⚽ {lang === 'es' ? 'Hacer Predicciones' : 'Make Predictions'}
                  </button>
                  <MatchesView fixtures={fixtures} />
                </>
              )
            )}

            {activeTab === 'Bracket' && (
              <div>
                <p className="text-xs text-slate-600 text-center mb-6">
                  {t.quiniela.bracketDesc}
                </p>
                <BracketView bracket={bracket} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prediction modal */}
      <PredictionModal
        match={predModal.match}
        prediction={myPredictions.find((p) => String(p.match_id) === String(predModal.match?.id))}
        isOpen={predModal.open}
        onClose={closePredict}
        onSave={handleSave}
        extraPointsEnabled={quiniela?.extra_points_enabled ?? false}
        isExtraStage={predModal.match ? isExtraPointsStage(predModal.match) : false}
      />

      {/* Rank-change notification overlay */}
      <RankChangeNotification
        change={activeRankChange}
        quinielaName={quiniela?.name}
        onDismiss={handleRankChangeDismiss}
      />

      {/* Admin feature announcement — only shown to admin of this specific quiniela */}
      <AdminFeatureModal quinielaId={id} isAdmin={isAdmin} />

      {/* Quiniela winner overlay — shown once per device when quiniela closes */}
      <AchievementOverlay
        achievement={winnerOverlay}
        onDismiss={() => {
          localStorage.setItem(`winner_seen_${id}`, '1')
          setWinnerOverlay(null)
        }}
      />
    </PageTransition>
  )
}

// ── Hero card helpers ─────────────────────────────────────────────────────────

const STAT_COLORS = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: 'text-amber-400'   },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     icon: 'text-sky-400'     },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: 'text-violet-400'  },
  slate:   { bg: 'bg-slate-700/30',   border: 'border-slate-600/30',   icon: 'text-slate-400'   },
}

function StatCard({ icon: Icon, color, value, label, labelFirst = false }) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.violet
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${c.bg} ${c.border}`}>
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${c.icon}`} />
      <div className="min-w-0">
        {labelFirst ? (
          <>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">{label}</div>
            <div className="text-xs font-bold text-white truncate leading-tight">{value}</div>
          </>
        ) : (
          <>
            <div className="text-xs font-bold text-white truncate leading-tight">{value}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">{label}</div>
          </>
        )}
      </div>
    </div>
  )
}

function formatDeadline(min) {
  if (min == null || min < 0) return '—'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

