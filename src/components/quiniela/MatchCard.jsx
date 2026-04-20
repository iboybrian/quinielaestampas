import { motion } from 'framer-motion'
import { Lock, Clock, CheckCircle, Edit3 } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { getPointLabel } from '../../lib/scoring'
import Flag from '../ui/Flag'

export default function MatchCard({ match, prediction, onPredict, deadlineMinutes = 10 }) {
  const matchTime = new Date(match.starts_at)
  const deadlineCutoff = new Date(matchTime.getTime() - deadlineMinutes * 60 * 1000)
  const isLocked = match.status !== 'scheduled' || isPast(deadlineCutoff)
  const isLive = match.status === 'live'
  const isFinished = match.status === 'finished'
  const hasPrediction = prediction != null
  const pointInfo = isFinished && hasPrediction ? getPointLabel(prediction.points_earned) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`glass rounded-2xl overflow-hidden transition-all duration-200 ${
        isLive ? 'border-red-400/30 shadow-lg shadow-red-500/10' :
        isFinished ? 'border-white/5' : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Live indicator strip */}
      {isLive && (
        <div className="bg-red-500 px-4 py-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live</span>
        </div>
      )}

      <div className="p-5">
        {/* Stage / date */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500 font-medium">{match.stage}</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            {format(matchTime, 'MMM d · HH:mm')}
          </div>
        </div>

        {/* Match row */}
        <div className="flex items-center gap-3">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2.5">
            <Flag code={match.home_flag} size="lg" />
            <span className="font-bold text-white text-sm leading-tight">{match.home_team}</span>
          </div>

          {/* Score / state */}
          <div className="flex-shrink-0 flex items-center justify-center min-w-[80px]">
            {isFinished ? (
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {match.home_score} <span className="text-slate-500">–</span> {match.away_score}
                </div>
                {pointInfo && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-xs font-bold mt-1 px-2 py-0.5 rounded-full ${pointInfo.color} ${pointInfo.bg}`}
                  >
                    +{prediction.points_earned} · {pointInfo.label}
                  </motion.div>
                )}
              </div>
            ) : isLocked ? (
              <div className="flex flex-col items-center gap-1 text-slate-600">
                <Lock className="w-5 h-5" />
                <span className="text-xs">Locked</span>
              </div>
            ) : (
              <div className="text-slate-600 font-bold text-lg">vs</div>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center gap-2.5 flex-row-reverse">
            <Flag code={match.away_flag} size="lg" />
            <span className="font-bold text-white text-sm leading-tight text-right">{match.away_team}</span>
          </div>
        </div>

        {/* Prediction section */}
        {!isLocked && !isFinished && (
          <div className="mt-4 pt-4 border-t border-white/5">
            {hasPrediction ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Your pick: <span className="font-bold">{prediction.home_score} – {prediction.away_score}</span></span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onPredict(match)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => onPredict(match)}
                className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-sm hover:bg-amber-500/20 transition-all"
              >
                + Add Prediction
              </motion.button>
            )}
          </div>
        )}

        {/* Finished — show my prediction vs actual */}
        {isFinished && hasPrediction && (
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
            <span className="text-slate-500">Your prediction</span>
            <span className="text-slate-300 font-bold">
              {prediction.home_score} – {prediction.away_score}
            </span>
          </div>
        )}
        {isFinished && !hasPrediction && (
          <div className="mt-4 pt-4 border-t border-white/5 text-center text-xs text-slate-600">
            No prediction submitted
          </div>
        )}
      </div>
    </motion.div>
  )
}
