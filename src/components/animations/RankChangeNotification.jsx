import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '../../contexts/LangContext'

// ⚽ Ball flying into a net — shown on rank-up
function GoalAnimation() {
  return (
    <div className="relative w-40 h-32 mx-auto mb-5 select-none" aria-hidden>
      <svg viewBox="0 0 160 120" className="absolute inset-0 w-full h-full">
        {/* Goal frame */}
        <rect x="20" y="12" width="120" height="80" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
        {/* Net verticals */}
        {[36, 52, 68, 84, 100, 116].map((x) => (
          <line key={x} x1={x} y1="12" x2={x} y2="92" stroke="#10b981" strokeWidth="0.8" opacity="0.35" />
        ))}
        {/* Net horizontals */}
        {[26, 40, 54, 68, 82].map((y) => (
          <line key={y} x1="20" y1={y} x2="140" y2={y} stroke="#10b981" strokeWidth="0.8" opacity="0.35" />
        ))}
        {/* Ground */}
        <line x1="8" y1="92" x2="152" y2="92" stroke="#10b981" strokeWidth="2" opacity="0.45" />
      </svg>

      {/* Ball */}
      <motion.span
        className="absolute text-[26px] leading-none"
        style={{ left: 0, top: '62%' }}
        initial={{ x: -8, y: 8, rotate: 0, opacity: 0, scale: 0.7 }}
        animate={{ x: 54, y: -36, rotate: 540, opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, type: 'tween', ease: 'easeOut' }}
      >
        ⚽
      </motion.span>

      {/* Impact flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 55% 38%, rgba(16,185,129,0.35) 0%, transparent 55%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 0.88, duration: 0.4, type: 'tween' }}
      />
    </div>
  )
}

// 🚩 Linesman offside flag — shown on rank-down
function OffsideAnimation() {
  return (
    <div className="relative w-40 h-32 mx-auto mb-5 flex items-center justify-center select-none" aria-hidden>
      <div className="relative">
        {/* Pole */}
        <div className="w-2 h-28 bg-slate-400 rounded-full mx-auto shadow-lg" />
        {/* Flag */}
        <motion.div
          className="absolute top-1 left-[7px] w-[68px] h-[42px] rounded-sm origin-left shadow-md"
          style={{ background: 'linear-gradient(135deg, #ef4444 50%, #f59e0b 50%)' }}
          initial={{ scaleX: 0, rotate: -10 }}
          animate={{
            scaleX: 1,
            rotate: [-10, 0, -18, -4, -12],
          }}
          transition={{
            scaleX: { delay: 0.15, duration: 0.3, type: 'tween', ease: 'easeOut' },
            rotate: { delay: 0.45, duration: 1.8, repeat: Infinity, type: 'tween', ease: 'easeInOut' },
          }}
        />
        {/* Arm holding the flag */}
        <motion.div
          className="absolute -top-2 -left-1 w-3 h-3 rounded-full bg-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
      </div>
    </div>
  )
}

export default function RankChangeNotification({ change, quinielaName, onDismiss }) {
  const { t } = useLang()

  useEffect(() => {
    if (!change) return
    const timer = setTimeout(onDismiss, 6500)
    return () => clearTimeout(timer)
  }, [change, onDismiss])

  const isUp = change?.direction === 'up'
  const positions = change?.positions ?? 0
  const newRank = change?.newRank ?? 0

  const message = isUp
    ? t.rankChange.rankUp
        .replace('{x}', positions)
        .replace('{quinielaName}', quinielaName ?? '')
        .replace('{newRank}', newRank)
    : t.rankChange.rankDown
        .replace('{x}', positions)
        .replace('{quinielaName}', quinielaName ?? '')
        .replace('{newRank}', newRank)

  const gradient   = isUp ? 'from-emerald-500/15 to-teal-500/15'    : 'from-red-500/15 to-orange-500/15'
  const glow       = isUp ? 'from-emerald-500/25 to-teal-500/25'    : 'from-red-500/25 to-orange-500/25'
  const textGrad   = isUp ? 'from-emerald-400 to-teal-300'           : 'from-red-400 to-orange-300'
  const badgeBg    = isUp ? 'bg-emerald-400 text-black'              : 'bg-red-400 text-white'
  const borderClr  = isUp ? 'border-emerald-500/30'                  : 'border-red-500/30'
  const title      = isUp ? t.rankChange.titleUp                     : t.rankChange.titleDown

  return (
    <AnimatePresence>
      {change && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.96) 100%)' }}
        >
          <motion.div
            initial={{ scale: 0.45, opacity: 0, y: 48 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -20 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.38, delay: 0.04 }}
            className={`relative text-center px-10 py-12 max-w-sm w-full mx-4 rounded-3xl bg-gradient-to-br ${gradient} border ${borderClr} backdrop-blur-sm`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow halo */}
            <div className={`absolute inset-0 bg-gradient-to-br ${glow} rounded-3xl blur-2xl scale-110 -z-10`} />

            {isUp ? <GoalAnimation /> : <OffsideAnimation />}

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, type: 'tween', ease: 'easeOut' }}
              className={`text-3xl font-black mb-3 bg-gradient-to-r ${textGrad} bg-clip-text text-transparent`}
            >
              {title}
            </motion.h2>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, type: 'tween', ease: 'easeOut' }}
              className="text-slate-300 text-sm leading-relaxed"
            >
              {message}
            </motion.p>

            {/* New rank badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'tween', ease: 'easeOut' }}
              className={`inline-block mt-5 px-6 py-2 rounded-full text-2xl font-black ${badgeBg} shadow-lg`}
            >
              #{newRank}
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.38 }}
              transition={{ delay: 1.8, type: 'tween' }}
              className="text-slate-500 text-xs mt-6"
            >
              {t.rankChange.dismiss}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
