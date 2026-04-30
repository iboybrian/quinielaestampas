import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { isGroupStage } from '../../lib/footballApi'
import { useLang } from '../../contexts/LangContext'
import MatchDetailModal from './MatchDetailModal'
import Flag from '../ui/Flag'

const PAGE_SIZE = 10

function MatchSummaryCard({ match, onClick }) {
  const { t } = useLang()
  const matchTime = new Date(match.starts_at)
  const isFinished = match.status === 'finished'
  const isLive     = match.status === 'live'
  const hasScore   = isFinished || isLive

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`glass rounded-2xl overflow-hidden cursor-pointer transition-colors ${
        isLive ? 'border-red-400/30 shadow-lg shadow-red-500/10' : 'hover:border-white/20'
      }`}
    >
      {/* Live strip */}
      {isLive && (
        <div className="bg-red-500 px-4 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{t.quiniela.liveBadge}</span>
        </div>
      )}

      <div className="p-4">
        {/* Stage / date */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-slate-500 font-medium">{match.stage}</span>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {format(matchTime, 'MMM d · HH:mm')}
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2.5">
            <Flag code={match.home_flag} size="md" />
            <span className="font-bold text-white text-sm leading-tight">{match.home_team}</span>
          </div>

          <div className="flex-shrink-0 min-w-[68px] text-center">
            {hasScore ? (
              <span className="text-lg font-black text-white">
                {match.home_score}
                <span className="text-slate-500 mx-1">–</span>
                {match.away_score}
              </span>
            ) : (
              <span className="text-slate-600 font-bold">vs</span>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2.5 flex-row-reverse">
            <Flag code={match.away_flag} size="md" />
            <span className="font-bold text-white text-sm leading-tight text-right">{match.away_team}</span>
          </div>
        </div>

        {/* Details hint */}
        <div className="mt-3 flex items-center justify-end gap-1.5 text-slate-600">
          <Eye className="w-3 h-3" />
          <span className="text-xs">{t.quiniela.details}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function MatchesView({ fixtures }) {
  const { t } = useLang()
  const [page, setPage]               = useState(0)
  const [selectedMatch, setSelected]  = useState(null)

  const groupMatches = useMemo(
    () =>
      fixtures
        .filter(isGroupStage)
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    [fixtures]
  )

  const totalPages  = Math.max(1, Math.ceil(groupMatches.length / PAGE_SIZE))
  const pageMatches = groupMatches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      {/* Page indicator */}
      <div className="text-xs text-slate-500 text-center mb-4">
        {groupMatches.length} matches · page {page + 1} / {totalPages}
      </div>

      {/* Match cards */}
      <div className="space-y-3 mb-6">
        {pageMatches.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <MatchSummaryCard match={match} onClick={() => setSelected(match)} />
          </motion.div>
        ))}

        {groupMatches.length === 0 && (
          <div className="text-center py-12 text-slate-600 text-sm">
            {t.quiniela.loadingMatches}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 glass rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.quiniela.prevPage}
          </motion.button>

          {/* Page dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  i === page
                    ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1.5 px-4 py-2.5 glass rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t.quiniela.nextPage}
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}

      {/* Detail modal — managed here so it overlays the whole page */}
      <MatchDetailModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
