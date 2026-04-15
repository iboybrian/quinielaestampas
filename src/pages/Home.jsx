import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Users, Trophy, Star, Shield, TrendingUp, ArrowRight } from 'lucide-react'
import PageTransition from '../components/layout/PageTransition'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
}

const features = [
  { icon: Zap, label: 'Live Scores', desc: 'Real-time via API-Football', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: Users, label: 'Group Play', desc: 'Invite friends by code', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: Trophy, label: 'Leaderboards', desc: 'Climb the rankings', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: Star, label: '900+ Stickers', desc: '48 teams + specials', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: Shield, label: 'Fair Play', desc: 'Predictions auto-lock', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: TrendingUp, label: 'Analytics', desc: 'Track your predictions', color: 'text-pink-400', bg: 'bg-pink-400/10' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      {/* Full-viewport hero */}
      <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Animated background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-float-slow delay-3000" />
          <div className="absolute top-2/3 left-1/3 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-float delay-5000" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-blue-500/6 rounded-full blur-3xl animate-float-slow delay-2000" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 text-center max-w-4xl mx-auto w-full"
        >
          {/* Trophy hero */}
          <motion.div variants={item} className="flex justify-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-amber-400/20 blur-3xl scale-150 rounded-full" />
              <motion.div
                animate={{ y: [0, -12, 0], rotate: [0, 2, 0, -2, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative text-7xl md:text-8xl"
              >
                🏆
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 variants={item} className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tight">
            <span className="text-white">WORLD CUP</span>
            <br />
            <span className="gold-text">2026 HUB</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={item} className="text-lg md:text-xl text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
            Predict match scores, compete with friends in quinielas, and complete your ultimate sticker collection.
          </motion.p>

          {/* CTA Cards */}
          <motion.div variants={item} className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto mb-16">
            {/* Marketplace */}
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/marketplace')}
              className="group relative glass rounded-3xl p-8 text-left overflow-hidden hover:border-amber-400/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/0 to-transparent group-hover:via-amber-400/40 transition-all duration-300" />
              <div className="relative z-10">
                <motion.div
                  animate={{ rotate: [0, 8, 0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="text-5xl mb-5"
                >📦</motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Sticker Album</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Track your collection across 48 teams, find trade partners, and unlock legendary stickers.
                </p>
                <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm group-hover:gap-3 transition-all">
                  Open Album <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>

            {/* Quiniela */}
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/quiniela')}
              className="group relative glass rounded-3xl p-8 text-left overflow-hidden hover:border-emerald-400/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/0 to-transparent group-hover:via-emerald-400/40 transition-all duration-300" />
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  className="text-5xl mb-5"
                >🎯</motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Quinielas</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Create prediction groups, score points for correct results, and watch the bracket live.
                </p>
                <div className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm group-hover:gap-3 transition-all">
                  Start Predicting <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Feature grid */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {features.map((f) => (
              <div
                key={f.label}
                className={`${f.bg} rounded-2xl p-4 flex flex-col items-center text-center backdrop-blur-sm border border-white/5`}
              >
                <f.icon className={`w-5 h-5 mb-2 ${f.color}`} />
                <div className="font-bold text-white text-sm">{f.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{f.desc}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </PageTransition>
  )
}
