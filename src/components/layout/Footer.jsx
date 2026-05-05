import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Star, Edit3, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'

// Auto-hide on scroll down, reappear on scroll up. Threshold prevents jitter
// from iOS overscroll bounce. Always visible near top of page.
const SCROLL_THRESHOLD = 8
const TOP_LOCK = 16

function useAutoHideOnScroll() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    const update = () => {
      const y = window.scrollY
      if (y < TOP_LOCK) {
        setHidden(false)
      } else if (Math.abs(y - lastY) >= SCROLL_THRESHOLD) {
        setHidden(y > lastY)
      }
      lastY = y
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

export default function Footer() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLang()
  const hidden = useAutoHideOnScroll()

  const buttons = [
    { icon: Star,  label: t.footer.myAlbum,     path: '/marketplace', activeColor: 'text-amber-400',   activeBg: 'bg-amber-400/10'   },
    { icon: Edit3, label: t.footer.predictions,  path: '/quiniela',    activeColor: 'text-emerald-400', activeBg: 'bg-emerald-400/10' },
    { icon: User,  label: t.footer.profile,      path: '/profile',     activeColor: 'text-blue-400',    activeBg: 'bg-blue-400/10'    },
  ]

  return (
    <motion.footer
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: hidden ? 80 : 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 safe-area-inset-bottom will-change-transform"
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
