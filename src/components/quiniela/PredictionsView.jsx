import { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import MatchCard from './MatchCard'
import { isGroupStage } from '../../lib/footballApi'
import { useLang } from '../../contexts/LangContext'
import { es } from 'date-fns/locale'

export default function PredictionsView({ fixtures, myPredictions, onBack, onPredict, t, scrollToDate, deadlineMinutes = 10 }) {
  const { lang } = useLang()

  useEffect(() => {
    if (!scrollToDate) return
    const el = document.getElementById(`pred-date-${scrollToDate}`)
    if (el) setTimeout(() => {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }, 150)
  }, [scrollToDate])
  const groupMatches = useMemo(
    () =>
      fixtures
        .filter(isGroupStage)
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    [fixtures]
  )

  const predictedCount = groupMatches.filter((m) =>
    myPredictions.some((p) => String(p.match_id) === String(m.id))
  ).length

  const total = groupMatches.length
  const pct = total > 0 ? (predictedCount / total) * 100 : 0

  // Group matches by calendar date
  const byDate = useMemo(() => {
    const map = {}
    groupMatches.forEach((m) => {
      const day = m.starts_at
        ? (() => { const d = new Date(m.starts_at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
        : 'unknown'
      if (!map[day]) map[day] = []
      map[day].push(m)
    })
    return map
  }, [groupMatches])

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

      {/* Matches grouped by day */}
      {Object.entries(byDate).map(([dateStr, dayMatches]) => (
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
                />
              )
            })}
          </div>
        </div>
      ))}

      {total === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          {t.quiniela.loadingFixtures}
        </div>
      )}
    </div>
  )
}
