import { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import MatchCard from './MatchCard'
import { isGroupStage } from '../../lib/footballApi'
import { useLang } from '../../contexts/LangContext'
import { es } from 'date-fns/locale'

export default function PredictionsView({ fixtures, myPredictions, onBack, onPredict, t, scrollToDate, deadlineMinutes = 10, extraPointsEnabled = false }) {
  const { lang } = useLang()

  useEffect(() => {
    if (!scrollToDate) return
    setTimeout(() => {
      let el = document.getElementById(`pred-date-${scrollToDate}`)
      if (!el) {
        const sorted = fixtures.slice().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
        const firstPending = sorted.find(m => m.status !== 'finished' && m.starts_at)
        if (firstPending) {
          const d = new Date(firstPending.starts_at)
          const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
          el = document.getElementById(`pred-date-${dateKey}`)
        }
      }
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' })
    }, 200)
  }, [scrollToDate, fixtures])

  const allMatches = useMemo(
    () => fixtures.slice().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    [fixtures]
  )

  const predictedCount = allMatches.filter((m) =>
    myPredictions.some((p) => String(p.match_id) === String(m.id))
  ).length

  const total = allMatches.length
  const pct = total > 0 ? (predictedCount / total) * 100 : 0

  // Group matches by stage section, then by date within each section
  const sections = useMemo(() => {
    const groupMatches = allMatches.filter(isGroupStage)
    const knockoutMatches = allMatches.filter(m => !isGroupStage(m))

    const byDate = (matches) => {
      const map = {}
      matches.forEach((m) => {
        const day = m.starts_at
          ? (() => { const d = new Date(m.starts_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
          : 'unknown'
        if (!map[day]) map[day] = []
        map[day].push(m)
      })
      return map
    }

    return [
      { key: 'group', label: t.quiniela.stages?.groupStage || 'Fase de Grupos', matches: groupMatches, byDate: byDate(groupMatches) },
      ...(knockoutMatches.length > 0
        ? [{ key: 'knockout', label: lang === 'es' ? 'Eliminación Directa' : 'Knockout Stage', matches: knockoutMatches, byDate: byDate(knockoutMatches) }]
        : []),
    ]
  }, [allMatches, t, lang])

  const progressLabel = (t.quiniela.progressLabel ?? '{done} of {total} predictions made')
    .replace('{done}', predictedCount)
    .replace('{total}', total)

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.quiniela.backToGroups}
      </button>

      {/* Progress card */}
      <div className="glass rounded-2xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-white font-bold text-sm">{progressLabel}</span>
          <span className="text-amber-400 font-black text-sm">{Math.round(pct)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
          />
        </div>
      </div>
      <p className="text-xs text-slate-600 text-center mb-6">
        {t.quiniela.predictLockNote}
      </p>

      {/* Matches grouped by stage section, then by day */}
      {sections.map((section) => (
        <div key={section.key} className="mb-8">
          {sections.length > 1 && (
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">{section.label}</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
          )}
          {Object.entries(section.byDate).map(([dateStr, dayMatches]) => (
            <div key={dateStr} id={`pred-date-${dateStr}`} className="mb-7">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {dateStr !== 'unknown'
                  ? format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMMM d', { locale: lang === 'es' ? es : undefined })
                  : 'TBD'}
              </div>
              <div className="space-y-4">
                {dayMatches.map((match) => {
                  const pred = myPredictions.find((p) => String(p.match_id) === String(match.id))
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={pred}
                      onPredict={onPredict}
                      deadlineMinutes={deadlineMinutes}
                      extraPointsEnabled={extraPointsEnabled}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}

      {total === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          {t.quiniela.loadingFixtures}
        </div>
      )}

      {/* Scroll-to-top — always visible */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 right-4 z-40 w-11 h-11 rounded-2xl bg-slate-800/90 border border-white/10 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/90 shadow-lg transition-colors md:bottom-8"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
