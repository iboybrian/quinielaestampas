import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { rankMembers } from '../../lib/scoring'
import { useLang } from '../../contexts/LangContext'

function RankBadge({ rank }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-sm">1</div>
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-300/10 border border-slate-300/30 flex items-center justify-center text-slate-300 font-black text-sm">2</div>
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-amber-800/20 border border-amber-700/40 flex items-center justify-center text-amber-700 font-black text-sm">3</div>
  return <div className="w-8 h-8 flex items-center justify-center text-slate-500 font-bold text-sm">{rank}</div>
}

function Avatar({ username, size = 'md' }) {
  const letter = username?.[0]?.toUpperCase() ?? '?'
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm'
  const colors = ['from-amber-400 to-orange-500', 'from-blue-400 to-cyan-500', 'from-purple-400 to-pink-500', 'from-emerald-400 to-teal-500', 'from-red-400 to-rose-500']
  const colorIndex = (username?.charCodeAt(0) ?? 0) % colors.length
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center font-black text-black flex-shrink-0`}>
      {letter}
    </div>
  )
}

export default function Standings({ quinielaId, members, predictions }) {
  const { t } = useLang()
  const [ranked, setRanked] = useState([])

  useEffect(() => {
    const memberStats = members.map((m) => {
      const memberPreds = predictions.filter((p) => p.user_id === m.id)
      return {
        ...m,
        totalPoints: memberPreds.reduce((s, p) => s + (p.points_earned || 0), 0),
        exact: memberPreds.filter((p) => p.points_earned === 5).length,
        correct: memberPreds.filter((p) => p.points_earned >= 2).length,
        played: memberPreds.filter((p) => p.points_earned !== null).length,
      }
    })
    setRanked(rankMembers(memberStats))
  }, [members, predictions])

  if (!ranked.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>{t.quiniela.standingsNoMembers}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 text-xs text-slate-500 font-medium uppercase tracking-wider mb-4">
        <span>{t.quiniela.standingsPlayer}</span>
        <div className="flex gap-6 text-right">
          <span className="w-10">{t.quiniela.standingsExact}</span>
          <span className="w-10">{t.quiniela.standingsPlayed}</span>
          <span className="w-12">{t.quiniela.standingsPoints}</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {ranked.map((member, i) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
              i === 0 ? 'bg-amber-400/5 border-amber-400/20 shadow-lg shadow-amber-500/5' :
              i === 1 ? 'bg-slate-300/5 border-slate-300/10' :
              i === 2 ? 'bg-amber-800/5 border-amber-700/15' :
              'glass border-white/5'
            }`}
          >
            <RankBadge rank={i + 1} />
            <Avatar username={member.username} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{member.username ?? t.quiniela.standingsUnknown}</div>
              <div className="text-xs text-slate-500">{member.correct} {t.quiniela.standingsCorrect}</div>
            </div>
            <div className="flex items-center gap-6 text-right">
              <div className="w-10">
                <div className="text-amber-400 font-bold">{member.exact}</div>
                <div className="text-xs text-slate-600">{t.quiniela.standingsExactLabel}</div>
              </div>
              <div className="w-10">
                <div className="text-slate-300 font-bold">{member.played}</div>
                <div className="text-xs text-slate-600">{t.quiniela.standingsPlayedLabel}</div>
              </div>
              <div className="w-12">
                <div className={`text-xl font-black ${i === 0 ? 'text-amber-400' : 'text-white'}`}>
                  {member.totalPoints}
                </div>
                <div className="text-xs text-slate-600">{t.quiniela.standingsPtsLabel}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
