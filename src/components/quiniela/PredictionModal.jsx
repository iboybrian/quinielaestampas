import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import Flag from '../ui/Flag'

function ScoreInput({ value, onChange, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xl transition-colors flex items-center justify-center"
        >−</motion.button>
        <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-3xl font-black text-white">
          {value}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => onChange(Math.min(20, value + 1))}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xl transition-colors flex items-center justify-center"
        >+</motion.button>
      </div>
    </div>
  )
}

export default function PredictionModal({ match, prediction, isOpen, onClose, onSave }) {
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setHomeScore(prediction?.home_score ?? 0)
      setAwayScore(prediction?.away_score ?? 0)
    }
  }, [isOpen, prediction])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(match.id, homeScore, awayScore)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!match) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="relative w-full max-w-sm bg-[#0A1628] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between p-5 pb-4">
              <h3 className="font-bold text-white text-lg">Your Prediction</h3>
              <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="px-6 pb-7">
              {/* Teams */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="text-center">
                  <div className="flex justify-center mb-2"><Flag code={match.home_flag} size="xl" /></div>
                  <div className="text-sm font-semibold text-white leading-tight max-w-[80px] truncate">{match.home_team}</div>
                </div>
                <span className="text-slate-600 font-bold">vs</span>
                <div className="text-center">
                  <div className="flex justify-center mb-2"><Flag code={match.away_flag} size="xl" /></div>
                  <div className="text-sm font-semibold text-white leading-tight max-w-[80px] truncate">{match.away_team}</div>
                </div>
              </div>

              {/* Score inputs */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <ScoreInput value={homeScore} onChange={setHomeScore} label={match.home_team} />
                <div className="text-2xl font-black text-slate-600 mt-5">–</div>
                <ScoreInput value={awayScore} onChange={setAwayScore} label={match.away_team} />
              </div>

              {/* Points guide */}
              <div className="grid grid-cols-3 gap-2 mb-7 text-center">
                {[
                  { pts: 5, label: 'Exact score', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { pts: 3, label: 'Goal diff', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { pts: 2, label: 'Winner', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                ].map(({ pts, label, color, bg }) => (
                  <div key={pts} className={`${bg} rounded-xl py-2.5 px-1`}>
                    <div className={`${color} font-black text-lg`}>{pts}</div>
                    <div className="text-slate-500 text-[10px] leading-tight mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Pick'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
