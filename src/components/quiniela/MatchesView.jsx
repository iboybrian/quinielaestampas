import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { Clock, ChevronLeft, ChevronRight, Eye, ChevronUp } from 'lucide-react'
import { useLang } from '../../contexts/LangContext'
import { es } from 'date-fns/locale'
import { translateStage } from '../../lib/translations'
import MatchDetailModal from './MatchDetailModal'
import Flag from '../ui/Flag'

const PAGE_SIZE = 10

// Each chip defines which stage strings it matches
const PHASE_CHIPS = [
  { key: 'group',  label: 'Grupos',    match: s => s?.toLowerCase().includes('group') },
  { key: 'r32',    label: '32avos',    match: s => s?.toLowerCase().includes('round of 32') },
  { key: 'r16',    label: '16avos',    match: s => s?.toLowerCase().includes('round of 16') },
  { key: 'qf',     label: 'Cuartos',   match: s => s?.toLowerCase().includes('quarter') },
  { key: 'sf',     label: 'Semis',     match: s => s?.toLowerCase().includes('semi') },
  { key: 'tpf',    label: '3er Lugar', match: s => { const l = s?.toLowerCase(); return l?.includes('3rd place') || l?.includes('third place') } },
  { key: 'final',  label: 'Final',     match: s => {
    const l = s?.toLowerCase()
    return l?.includes('final') && !l?.includes('semi') && !l?.includes('quarter') && !l?.includes('3rd') && !l?.includes('third') && !l?.includes('place')
  }},
]

function MatchSummaryCard({ match, onClick }) {
  const { lang, t } = useLang()
  const matchTime   = new Date(match.starts_at)
  const matchTimeMs = matchTime.getTime()
  const nowMs       = Date.now()
  const isFinished  = match.status === 'finished'
  const isLive      = match.status === 'live' ||
    (match.status === 'scheduled' && nowMs >= matchTimeMs && nowMs <= matchTimeMs + 120 * 60 * 1000)
  const hasScore = (isFinished || isLive) && match.home_score !== null

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`glass rounded-2xl overflow-hidden cursor-pointer transition-colors ${
        isLive ? 'border-red-400/30 shadow-lg shadow-red-500/10' : 'hover:border-white/20'
      }`}
    >
      {isLive && (
        <div className="bg-red-500 px-4 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{t.quiniela.liveBadge}</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium">{translateStage(match.stage, t)}</span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {format(matchTime, 'MMM d · HH:mm', { locale: lang === 'es' ? es : undefined })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5">
            <Flag code={match.home_flag} size="md" />
            <span className="font-bold text-white text-sm leading-tight">{t.countries[match.home_team] || match.home_team}</span>
          </div>
          <div className="flex-shrink-0 min-w-[68px] text-center">
            {hasScore ? (
              <span className="text-lg font-black text-white">
                {match.home_score}<span className="text-slate-500 mx-1">–</span>{match.away_score}
              </span>
            ) : (
              <span className="text-slate-600 font-bold">vs</span>
            )}
          </div>
          <div className="flex-1 flex items-center gap-2.5 flex-row-reverse">
            <Flag code={match.away_flag} size="md" />
            <span className="font-bold text-white text-sm leading-tight text-right">{t.countries[match.away_team] || match.away_team}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-slate-600">
          <Eye className="w-3 h-3" />
          <span className="text-xs">{t.quiniela.details}</span>
        </div>
      </div>
    </motion.div>
  )
}

function PaginationBar({ page, totalPages, changePage, t }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-2">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => changePage(page - 1)}
        disabled={page === 0}
        className="flex items-center gap-1 px-3 py-2.5 glass rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">{t.quiniela.prevPage}</span>
      </motion.button>

      <div className="flex gap-1 items-center">
        {(() => {
          const pages = []
          const addPage = (i) => pages.push(
            <button
              key={i}
              onClick={() => changePage(i)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                i === page
                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                  : 'text-slate-600 hover:text-slate-400'
              }`}
            >{i + 1}</button>
          )
          const addDots = (key) => pages.push(
            <span key={key} className="text-slate-700 text-xs px-0.5">…</span>
          )
          if (totalPages <= 7) {
            for (let i = 0; i < totalPages; i++) addPage(i)
          } else {
            addPage(0)
            if (page > 2) addDots('start')
            for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) addPage(i)
            if (page < totalPages - 3) addDots('end')
            addPage(totalPages - 1)
          }
          return pages
        })()}
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => changePage(page + 1)}
        disabled={page >= totalPages - 1}
        className="flex items-center gap-1 px-3 py-2.5 glass rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        <span className="hidden sm:inline">{t.quiniela.nextPage}</span>
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </div>
  )
}

export default function MatchesView({ fixtures }) {
  const { t }                             = useLang()
  const [page, setPage]                   = useState(0)
  const [selectedMatch, setSelected]      = useState(null)
  const [scrollTick, setScrollTick]       = useState(0)
  const [activeChip, setActiveChip]       = useState(null)
  const pendingScrollRef                  = useRef(null)

  const sortedMatches = useMemo(
    () => fixtures.slice().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    [fixtures]
  )

  const totalPages  = Math.max(1, Math.ceil(sortedMatches.length / PAGE_SIZE))
  const pageMatches = sortedMatches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Only show phase chips that have at least one match
  const activeChips = useMemo(
    () => PHASE_CHIPS.filter(chip => sortedMatches.some(m => chip.match(m.stage))),
    [sortedMatches]
  )

  // Group current page matches by stage (preserving date order)
  const stageGroups = useMemo(() => {
    const groups = []
    let currentStage = null
    pageMatches.forEach((match) => {
      if (match.stage !== currentStage) {
        currentStage = match.stage
        groups.push({ stage: match.stage, matches: [match] })
      } else {
        groups[groups.length - 1].matches.push(match)
      }
    })
    return groups
  }, [pageMatches])

  // After page change settles, scroll to pending stage anchor
  useEffect(() => {
    if (!pendingScrollRef.current) return
    const target = pendingScrollRef.current
    pendingScrollRef.current = null
    setTimeout(() => {
      const el = document.getElementById(`stage-${target}`)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 80
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, 60)
  }, [scrollTick])

  const changePage = (n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const jumpToPhase = (chip) => {
    const first = sortedMatches.find(m => chip.match(m.stage))
    if (!first) return
    const targetPage = Math.floor(sortedMatches.indexOf(first) / PAGE_SIZE)
    pendingScrollRef.current = first.stage
    setActiveChip(chip.key)
    setPage(targetPage)
    setScrollTick(prev => prev + 1)
  }

  return (
    <div>
      {/* Phase navigation chips */}
      {activeChips.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center mb-4">
          {activeChips.map(chip => {
            const isActive = activeChip === chip.key
            return (
              <motion.button
                key={chip.key}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.15 }}
                onClick={() => jumpToPhase(chip)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  isActive
                    ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 shadow-sm shadow-amber-400/10'
                    : 'glass border-white/10 text-slate-300 hover:text-white hover:border-white/25'
                }`}
              >
                {chip.label}
              </motion.button>
            )
          })}
        </div>
      )}

      {/* Count + page indicator */}
      <div className="text-xs text-slate-500 text-center mb-4">
        {(t.quiniela.matchesPage ?? '{total} partidos · página {current} / {max}')
          .replace('{total}', sortedMatches.length)
          .replace('{current}', page + 1)
          .replace('{max}', totalPages)}
      </div>

      {/* Matches grouped by stage */}
      <div className="space-y-6 mb-6">
        {stageGroups.map(({ stage, matches }) => (
          <div key={stage}>
            {/* Stage anchor + separator */}
            <div id={`stage-${stage}`} className="flex items-center gap-3 mb-3 scroll-mt-20">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                {translateStage(stage, t)}
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="space-y-3">
              {matches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                >
                  <MatchSummaryCard match={match} onClick={() => setSelected(match)} />
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {sortedMatches.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">
            {t.quiniela.loadingMatches}
          </div>
        )}
      </div>

      {/* Pagination — bottom only */}
      <PaginationBar page={page} totalPages={totalPages} changePage={changePage} t={t} />

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

      <MatchDetailModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
