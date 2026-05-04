import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Loader2, Clock, Users, Phone, EyeOff, Trophy, Settings, Ticket, Coins } from 'lucide-react'
import { useQuinielaGroup, useFixtures, maskPredictions } from '../hooks/useQuiniela'
import { useAuth } from '../contexts/AuthContext'
import { isKnockoutStage, normalizeBracket, MOCK_BRACKET } from '../lib/footballApi'
import { useLang } from '../contexts/LangContext'
import { rankMembers } from '../lib/scoring'
import Standings from '../components/quiniela/Standings'
import RankChangeNotification from '../components/animations/RankChangeNotification'
import GroupsView from '../components/quiniela/GroupsView'
import PredictionsView from '../components/quiniela/PredictionsView'
import MatchesView from '../components/quiniela/MatchesView'
import BracketView from '../components/quiniela/BracketView'
import ResultsMatrix from '../components/quiniela/ResultsMatrix'
import PredictionModal from '../components/quiniela/PredictionModal'
import PageTransition from '../components/layout/PageTransition'

export default function QuinielaGroup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLang()

  const { user } = useAuth()
  const { quiniela, members, predictions, myPredictions, loading, loadError, isAdmin, savePrediction } = useQuinielaGroup(id)
  const { fixtures, loading: fixturesLoading } = useFixtures()

  // Mask other users' predictions for matches whose deadline hasn't passed yet.
  // myPredictions stays unmasked for editing/MatchCard. visiblePredictions goes to Matrix/Standings.
  const visiblePredictions = useMemo(
    () => maskPredictions(predictions, fixtures, user?.id),
    [predictions, fixtures, user?.id]
  )
  const hiddenMatchCount = useMemo(
    () => fixtures.filter((f) => f.status === 'scheduled' || f.status === 'not_started').length,
    [fixtures]
  )

  const [activeTab, setActiveTab] = useState('Standings')
  const [showPredictions, setShowPredictions] = useState(false)
  const [predModal, setPredModal] = useState({ open: false, match: null })
  const [copied, setCopied] = useState(false)

  // Rank-change notification — detected once per mount, shown on first Standings visit
  const [pendingRankChange, setPendingRankChange] = useState(null)
  const [activeRankChange, setActiveRankChange] = useState(null)
  const rankCheckedRef = useRef(false)

  useEffect(() => {
    if (rankCheckedRef.current || !user || members.length === 0) return
    rankCheckedRef.current = true

    const memberStats = members.map((m) => {
      const preds = visiblePredictions.filter((p) => p.user_id === m.id)
      return {
        ...m,
        totalPoints: preds.reduce((s, p) => s + (p.points_earned || 0), 0),
        exact:   preds.filter((p) => p.points_earned === 5).length,
        correct: preds.filter((p) => p.points_earned >= 2).length,
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
  }, [members, visiblePredictions, user, id])

  // Fire the overlay when user lands on (or switches to) Standings tab
  useEffect(() => {
    if (activeTab === 'Standings' && pendingRankChange) {
      setActiveRankChange(pendingRankChange)
      setPendingRankChange(null)
    }
  }, [activeTab, pendingRankChange])

  const handleRankChangeDismiss = useCallback(() => setActiveRankChange(null), [])

  // Bracket tab appears only when knockout fixtures exist
  const hasKnockouts = fixtures.some(isKnockoutStage)
  const bracket = hasKnockouts ? normalizeBracket(fixtures) : MOCK_BRACKET

  const TABS = [
    { key: 'Standings', label: `🏆 ${lang === 'es' ? 'Posiciones' : 'Standings'}` },
    { key: 'Matrix',    label: `📊 ${lang === 'es' ? 'Matriz' : 'Matrix'}` },
    { key: 'Groups',    label: `⚽ ${t.quiniela.groupsTab}` },
    { key: 'Matches',   label: `📋 ${t.quiniela.matchesTab}` },
    ...(hasKnockouts ? [{ key: 'Bracket', label: `🌳 ${t.quiniela.bracketTab}` }] : []),
  ]

  const copyCode = () => {
    if (!quiniela?.code) return
    navigator.clipboard.writeText(quiniela.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openPredict  = (match) => setPredModal({ open: true, match })
  const closePredict = () => setPredModal({ open: false, match: null })
  const handleSave   = async (matchId, home, away) => { await savePrediction(matchId, home, away) }

  const handleTabChange = (key) => {
    setActiveTab(key)
    setShowPredictions(false)
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
            {isAdmin && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(`/quiniela/${id}/manage`)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
                title={t.quiniela.manage}
              >
                <Settings className="w-3.5 h-3.5" />
              </motion.button>
            )}
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
                      Predicciones de otros participantes ocultas hasta el cierre de{' '}
                      <span className="text-slate-300 font-semibold">{hiddenMatchCount}</span>{' '}
                      {hiddenMatchCount === 1 ? 'partido' : 'partidos'}.
                    </span>
                  </div>
                )}
                <Standings quinielaId={id} members={members} predictions={visiblePredictions} />
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
                        🔒 Predicciones ocultas en{' '}
                        <span className="text-slate-300 font-semibold">{hiddenMatchCount}</span>{' '}
                        {hiddenMatchCount === 1 ? 'partido' : 'partidos'} — se revelan al cierre.
                      </span>
                    </div>
                  )}
                  <ResultsMatrix members={members} predictions={visiblePredictions} fixtures={fixtures} />
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
                  fixtures={fixtures}
                  myPredictions={myPredictions}
                  onBack={() => setShowPredictions(false)}
                  onPredict={openPredict}
                  t={t}
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
                <MatchesView fixtures={fixtures} />
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
        prediction={myPredictions.find((p) => p.match_id === predModal.match?.id)}
        isOpen={predModal.open}
        onClose={closePredict}
        onSave={handleSave}
      />

      {/* Rank-change notification overlay */}
      <RankChangeNotification
        change={activeRankChange}
        quinielaName={quiniela?.name}
        onDismiss={handleRankChangeDismiss}
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
}

function StatCard({ icon: Icon, color, value, label }) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.violet
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${c.bg} ${c.border}`}>
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${c.icon}`} />
      <div className="min-w-0">
        <div className="text-xs font-bold text-white truncate leading-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-tight">{label}</div>
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
