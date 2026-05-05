import { motion } from 'framer-motion'
import { Menu, Trophy, LogIn, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'

export default function Navbar({ onMenuOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { lang, toggle, t } = useLang()

  const desktopLinks = [
    { label: t.nav.stickerAlbum, path: '/marketplace', activeColor: 'text-emerald-400' },
    { label: t.nav.quinielas,    path: '/quiniela',    activeColor: 'text-amber-400'   },
    { label: t.nav.profile,      path: '/profile',     activeColor: 'text-blue-400'    },
  ]

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 h-16"
    >
      <div className="absolute inset-0 bg-[#050B1A]/80 backdrop-blur-md border-b border-white/5" />

      <div className="relative flex items-center justify-between h-full px-4 md:px-8 max-w-7xl mx-auto">

        {/* ── MOBILE: burger ── */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMenuOpen}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl glass text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        {/* ── MOBILE: logo centered (absolute wrapper handles centering, motion handles tap scale) ── */}
        <div className="md:hidden absolute left-1/2 -translate-x-1/2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Trophy className="w-6 h-6 text-amber-400 relative" />
            </div>
            <span className="font-black text-lg tracking-tight">
              <span className="gold-text">WC</span>
              <span className="text-white"> 2026</span>
            </span>
          </motion.button>
        </div>

        {/* ── DESKTOP: logo (left) ── */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy className="w-6 h-6 text-amber-400 relative" />
          </div>
          <span className="font-black text-lg tracking-tight">
            <span className="gold-text">WC</span>
            <span className="text-white"> 2026</span>
          </span>
        </motion.button>

        {/* ── DESKTOP: nav links (truly centered) ── */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {desktopLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path)
            return (
              <motion.button
                key={link.path}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(link.path)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? `${link.activeColor} bg-white/5`
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current"
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* ── RIGHT: lang toggle (both) + auth (desktop only) ── */}
        <div className="flex items-center gap-2">
          {/* Language toggle — visible on all breakpoints */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            className="flex items-center rounded-lg border border-white/10 overflow-hidden text-xs font-bold"
            aria-label="Toggle language"
          >
            <span className={`px-2.5 py-1.5 transition-colors duration-200 ${
              lang === 'es' ? 'bg-amber-400/20 text-amber-400' : 'text-slate-500 hover:text-white'
            }`}>
              ES
            </span>
            <span className="w-px self-stretch bg-white/10" />
            <span className={`px-2.5 py-1.5 transition-colors duration-200 ${
              lang === 'en' ? 'bg-amber-400/20 text-amber-400' : 'text-slate-500 hover:text-white'
            }`}>
              EN
            </span>
          </motion.button>

          {/* Auth — desktop only */}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={signOut}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.signOut}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
              className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20"
            >
              <LogIn className="w-4 h-4" />
              {t.nav.signIn}
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  )
}
