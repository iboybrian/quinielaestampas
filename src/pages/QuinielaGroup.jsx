import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Loader2, DollarSign, Clock, Users, Info, Phone, EyeOff } from 'lucide-react'
import { useQuinielaGroup, useFixtures, maskPredictions } from '../hooks/useQuiniela'
import { useAuth } from '../contexts/AuthContext'
import { isKnockoutStage, normalizeBracket, MOCK_BRACKET } from '../lib/footballApi'
import { useLang } from '../contexts/LangContext'
import Standings from '../components/quiniela/Standings'
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
  const { quiniela, members, predictions, myPredictions, loading, savePrediction } = useQuinielaGroup(id)
  const { fixtures, loading: fixturesLoading } = useFixtures()

  // Mask other users' predictions for matches whose deadline hasn't passed yet.
  // myPredictions stays unmasked for editing/MatchCard. visiblePredictions goes to Matrix/Standings.
  const deadlineMinutes = quiniela?.prediction_deadline_minutes ?? 10
  const visiblePredictions = useMemo(
    () => maskPredictions(predictions, fixtures, user?.id, deadlineMinutes),
    [predictions, fixtures, user?.id, deadlineMinutes]
  )
  const hiddenMatchCount = useMemo(() => {
    const now = Date.now()
    return fixtures.filter((f) => {
      if (f.status !== 'scheduled') return false
      const cutoff = new Date(f.starts_at).getTime() - deadlineMinutes * 60_000
      return now < cutoff
    }).length
  }, [fixtures, deadlineMinutes])

  const [activeTab, setActiveTab] = useState('Standings')
  const [showPredictions, setShowPredictions] = useState(false)
  const [predModal, setPredModal] = useState({ open: false, match: null })
  const [copied, setCopied] = useState(false)

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
          Loading group…
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Back + title */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/quiniela')}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white truncate">{quiniela?.name ?? 'Group'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-mono">{quiniela?.code}</span>
              <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode}
                className="text-slate-600 hover:text-slate-400 transition-colors">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </motion.button>
            </div>
          </div>
          <span className="text-sm text-slate-500 flex-shrink-0">{members.length} members</span>
        </div>

        {/* Info chips — only render configured fields */}
        {quiniela && (quiniela.entry_fee || quiniela.prediction_deadline_minutes !== 10 || quiniela.participant_limit || quiniela.description || quiniela.info_contact) && (
          <div className="mb-5 space-y-2">
            {quiniela.description && (
              <p className="text-xs text-slate-400 leading-relaxed px-1">{quiniela.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {quiniela.entry_fee && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <DollarSign className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-300 font-semibold">{t.quiniela.entryFee}: {quiniela.entry_fee}</span>
                </div>
              )}
              {quiniela.prediction_deadline_minutes != null && quiniela.prediction_deadline_minutes !== 10 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">{t.quiniela.predClose}: {quiniela.prediction_deadline_minutes} {t.quiniela.minutesBefore}</span>
                </div>
              )}
              {quiniela.participant_limit && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Users className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">{members.length} / {quiniela.participant_limit} {t.quiniela.limit}</span>
                </div>
              )}
              {quiniela.info_contact && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-xs text-slate-400">{quiniela.info_contact}</span>
                </div>
              )}
            </div>
          </div>
        )}

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
                  Loading fixtures…
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
                  Loading fixtures…
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
                  Loading fixtures…
                </div>
              ) : (
                <MatchesView fixtures={fixtures} />
              )
            )}

            {activeTab === 'Bracket' && (
              <div>
                <p className="text-xs text-slate-600 text-center mb-6">
                  Live knockout bracket — winners advance, losers fade out.
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
    </PageTransition>
  )
}
