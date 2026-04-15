import { motion } from 'framer-motion'
import { Star, Edit3, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const buttons = [
  { icon: Star, label: 'My Album', path: '/marketplace', activeColor: 'text-amber-400', activeBg: 'bg-amber-400/10' },
  { icon: Edit3, label: 'Predictions', path: '/quiniela', activeColor: 'text-emerald-400', activeBg: 'bg-emerald-400/10' },
  { icon: User, label: 'Profile', path: '/profile', activeColor: 'text-blue-400', activeBg: 'bg-blue-400/10' },
]

export default function Footer() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <motion.footer
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 z-30 h-16 safe-area-inset-bottom"
    >
      <div className="absolute inset-0 bg-[#050B1A]/90 backdrop-blur-xl border-t border-white/5" />
      <div className="relative flex items-center justify-around h-full px-4 max-w-md mx-auto">
        {buttons.map((btn) => {
          const isActive = pathname.startsWith(btn.path)
          return (
            <motion.button
              key={btn.path}
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate(btn.path)}
              className={`flex flex-col items-center justify-center gap-1 px-5 py-1.5 rounded-2xl transition-all duration-200 ${
                isActive ? `${btn.activeBg} ${btn.activeColor}` : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <btn.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-semibold tracking-wide">{btn.label}</span>
              {isActive && (
                <motion.div
                  layoutId="footer-indicator"
                  className="absolute bottom-1.5 w-1 h-1 rounded-full bg-current"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.footer>
  )
}
