import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowRightLeft, MessageCircle, Loader2 } from 'lucide-react'
import { findTradeMatches } from '../../hooks/useStickers'
import { useAuth } from '../../contexts/AuthContext'

function MatchScoreBar({ score, max = 10 }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
      />
    </div>
  )
}

function TraderCard({ trader, onChat }) {
  const letter = trader.username?.[0]?.toUpperCase() ?? '?'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black font-black text-lg flex-shrink-0">
        {letter}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{trader.username ?? 'Collector'}</div>
        {trader.country && (
          <div className="text-xs text-slate-500 mt-0.5">{trader.country}</div>
        )}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-500">Match score</span>
            <span className="text-xs text-emerald-400 font-bold">{trader.matchScore} stickers</span>
          </div>
          <MatchScoreBar score={trader.matchScore} />
        </div>
      </div>

      {/* Chat button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChat(trader)}
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
      </motion.button>
    </motion.div>
  )
}

export default function TradeMatcher({ onOpenChat }) {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    findTradeMatches(user.id)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Sign in to find trade partners</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Finding matches…
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="text-center py-16">
        <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 font-semibold mb-1">No trade matches yet</p>
        <p className="text-slate-600 text-sm">Mark which stickers you have extras of and which you need to find collectors near you.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
        <h3 className="font-bold text-white">Trade Matches</h3>
        <span className="text-xs bg-emerald-400/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">{matches.length}</span>
      </div>
      {matches.map((trader) => (
        <TraderCard key={trader.id} trader={trader} onChat={onOpenChat} />
      ))}
    </div>
  )
}
