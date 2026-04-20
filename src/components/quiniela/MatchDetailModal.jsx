import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { getFixtureStats } from '../../lib/footballApi'
import { useLang } from '../../contexts/LangContext'
import Flag from '../ui/Flag'

// Stats to display, with both language labels and whether higher = better
const STATS = [
  { key: 'Ball Possession',  es: 'Posesión',            en: 'Possession',       higherIsBetter: true  },
  { key: 'Total Shots',      es: 'Tiros Totales',        en: 'Total Shots',      higherIsBetter: true  },
  { key: 'Shots on Goal',    es: 'Tiros al Arco',        en: 'Shots on Goal',    higherIsBetter: true  },
  { key: 'Corner Kicks',     es: 'Corners',              en: 'Corner Kicks',     higherIsBetter: true  },
  { key: 'Total passes',     es: 'Pases Totales',        en: 'Total Passes',     higherIsBetter: true  },
  { key: 'Passes %',         es: '% Pases',              en: 'Pass Accuracy',    higherIsBetter: true  },
  { key: 'Fouls',            es: 'Faltas',               en: 'Fouls',            higherIsBetter: false },
  { key: 'Yellow Cards',     es: 'T. Amarillas',         en: 'Yellow Cards',     higherIsBetter: false },
  { key: 'Red Cards',        es: 'T. Rojas',             en: 'Red Cards',        higherIsBetter: false },
  { key: 'Offsides',         es: 'Fueras de Juego',      en: 'Offsides',         higherIsBetter: false },
]

function StatRow({ stat, homeVal, awayVal, lang }) {
  const label = lang === 'es' ? stat.es : stat.en
  const homeNum = parseFloat(String(homeVal ?? '').replace('%', ''))
  const awayNum = parseFloat(String(awayVal ?? '').replace('%', ''))

  let homeWins = false
  let awayWins = false
  if (!isNaN(homeNum) && !isNaN(awayNum) && homeNum !== awayNum) {
    homeWins = stat.higherIsBetter ? homeNum > awayNum : homeNum < awayNum
    awayWins = stat.higherIsBetter ? awayNum > homeNum : awayNum < homeNum
  }

  return (
    <div className="flex items-center py-2 border-b border-white/5 last:border-0">
      <span className={`text-sm font-bold w-20 text-right pr-3 tabular-nums ${homeWins ? 'text-amber-400' : 'text-slate-300'}`}>
        {homeVal ?? '–'}
      </span>
      <span className="flex-1 text-center text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-bold w-20 pl-3 tabular-nums ${awayWins ? 'text-emerald-400' : 'text-slate-300'}`}>
        {awayVal ?? '–'}
      </span>
    </div>
  )
}

export default function MatchDetailModal({ match, isOpen, onClose }) {
  const { lang, t } = useLang()
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !match) { setStats(null); return }
    if (match.status !== 'finished' && match.status !== 'live') return
    setStatsLoading(true)
    getFixtureStats(match.id)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false))
  }, [isOpen, match?.id])

  if (!match) return null

  const hasPenalties = match.home_penalties != null && match.away_penalties != null
  const isFinished   = match.status === 'finished'
  const isLive       = match.status === 'live'
  const hasScore     = isFinished || isLive

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-sm bg-[#0A1628] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            style={{ maxHeight: '90dvh', overflowY: 'auto' }}
          >
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h3 className="font-bold text-white text-lg">{t.quiniela.matchDetails}</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="px-6 pb-7 pt-2">
              {/* Teams + score */}
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="text-center flex-1">
                  <div className="flex justify-center mb-2"><Flag code={match.home_flag} size="2xl" /></div>
                  <div className="text-sm font-bold text-white leading-tight">{match.home_team}</div>
                </div>

                <div className="text-center flex-shrink-0 px-1">
                  {hasScore ? (
                    <>
                      <div className="text-3xl font-black text-white tracking-tight">
                        {match.home_score}
                        <span className="text-slate-500 mx-2">–</span>
                        {match.away_score}
                      </div>
                      {hasPenalties && (
                        <div className="text-xs text-slate-500 mt-1">
                          pen. {match.home_penalties} – {match.away_penalties}
                        </div>
                      )}
                      {isLive && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Live</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-600 font-bold text-xl">vs</div>
                  )}
                </div>

                <div className="text-center flex-1">
                  <div className="flex justify-center mb-2"><Flag code={match.away_flag} size="2xl" /></div>
                  <div className="text-sm font-bold text-white leading-tight">{match.away_team}</div>
                </div>
              </div>

              {/* Stage / date / venue */}
              <div className="glass rounded-2xl p-4 mb-5 text-center space-y-1.5">
                <div className="text-sm font-semibold text-white">{match.stage}</div>
                <div className="text-xs text-slate-400">
                  {format(new Date(match.starts_at), 'EEEE, MMMM d yyyy · HH:mm')}
                </div>
                {match.venue && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {match.venue}
                  </div>
                )}
              </div>

              {/* Stats section */}
              {hasScore ? (
                <>
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-1">
                    {t.quiniela.matchStats}
                  </div>

                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {t.quiniela.loadingStats}
                    </div>
                  ) : stats ? (
                    <>
                      {/* Team label row */}
                      <div className="flex items-center py-1 mb-0.5">
                        <span className="text-[11px] font-bold text-amber-400/60 w-20 text-right pr-3 truncate">
                          {match.home_team}
                        </span>
                        <span className="flex-1" />
                        <span className="text-[11px] font-bold text-emerald-400/60 w-20 pl-3 truncate">
                          {match.away_team}
                        </span>
                      </div>
                      {STATS.map((stat) => {
                        const hv = stats.home.stats[stat.key]
                        const av = stats.away.stats[stat.key]
                        if (hv == null && av == null) return null
                        return (
                          <StatRow key={stat.key} stat={stat} homeVal={hv} awayVal={av} lang={lang} />
                        )
                      })}
                    </>
                  ) : (
                    <div className="text-center text-slate-600 text-sm py-6">
                      {t.quiniela.statsUnavailable}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-slate-600 text-sm py-4">
                  {t.quiniela.notPlayed}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
