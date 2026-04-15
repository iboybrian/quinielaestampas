import { motion } from 'framer-motion'
import { Menu, Trophy } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ onMenuOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-40 h-16"
    >
      <div className="absolute inset-0 bg-[#050B1A]/80 backdrop-blur-md border-b border-white/5" />
      <div className="relative flex items-center justify-between h-full px-4 max-w-7xl mx-auto">
        {/* Burger */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onMenuOpen}
          className="w-10 h-10 flex items-center justify-center rounded-xl glass text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </motion.button>

        {/* Logo */}
        <motion.button
          whileHover={{ scale: 1.05 }}
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

        {/* Right side — spacer matching burger width */}
        <div className="w-10" />
      </div>
    </motion.header>
  )
}
