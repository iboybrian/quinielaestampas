import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Star, Trophy, Zap } from 'lucide-react'

// Confetti particle component
function Particle({ x, y, color, delay }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-sm"
      style={{ left: `${x}%`, top: '-10px', backgroundColor: color }}
      initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: '110vh', opacity: 0, rotate: 720, scale: 0.3 }}
      transition={{ duration: 2.5 + Math.random(), delay, ease: 'easeIn' }}
    />
  )
}

const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#ffffff']

function generateParticles(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.8,
  }))
}

const ACHIEVEMENT_TYPES = {
  team_complete: { icon: '🌟', title: 'Team Complete!', color: 'from-amber-400 to-yellow-300', iconBg: 'bg-amber-400/20' },
  legendary: { icon: '👑', title: 'Legendary Sticker!', color: 'from-purple-400 to-pink-400', iconBg: 'bg-purple-400/20' },
  rank_1: { icon: '🏆', title: '#1 on the Board!', color: 'from-amber-400 to-orange-400', iconBg: 'bg-amber-400/20' },
  album_complete: { icon: '📖', title: 'Album Complete!', color: 'from-emerald-400 to-cyan-400', iconBg: 'bg-emerald-400/20' },
}

export default function AchievementOverlay({ achievement, onDismiss }) {
  const [particles] = useState(generateParticles)
  const config = ACHIEVEMENT_TYPES[achievement?.type] ?? ACHIEVEMENT_TYPES.legendary

  useEffect(() => {
    if (!achievement) return
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [achievement, onDismiss])

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)' }}
        >
          {/* Confetti */}
          {particles.map((p) => (
            <Particle key={p.id} {...p} />
          ))}

          {/* Card */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
            className="relative text-center px-10 py-12 max-w-sm w-full mx-4"
          >
            {/* Glow ring */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5 rounded-4xl blur-3xl scale-150`} />

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.25 }}
              className={`w-28 h-28 mx-auto mb-6 rounded-full ${config.iconBg} flex items-center justify-center text-6xl shadow-2xl`}
            >
              {config.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-4xl font-black mb-3 bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}
            >
              {config.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-white font-semibold mb-2"
            >
              {achievement.title}
            </motion.p>
            {achievement.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-slate-400"
              >
                {achievement.description}
              </motion.p>
            )}

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1.5 }}
              className="text-slate-500 text-sm mt-8"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for triggering achievements
export function useAchievements() {
  const [achievement, setAchievement] = useState(null)
  const trigger = (type, title, description) => setAchievement({ type, title, description })
  const dismiss = () => setAchievement(null)
  return { achievement, trigger, dismiss }
}
