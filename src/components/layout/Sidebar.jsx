import { AnimatePresence, motion } from 'framer-motion'
import { User, Settings, Shield, LogOut, LogIn, Trophy, X, Star, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const { t } = useLang()

  const navItems = [
    { icon: User,     label: t.sidebar.myProfile,    path: '/profile',     color: 'text-blue-400'    },
    { icon: Trophy,   label: t.sidebar.myQuinielas,  path: '/quiniela',    color: 'text-amber-400'   },
    { icon: Star,     label: t.sidebar.stickerAlbum, path: '/marketplace', color: 'text-emerald-400' },
    { icon: Settings, label: t.sidebar.settings,     path: '/settings',    color: 'text-slate-400'   },
    { icon: Shield,   label: t.sidebar.privacy,      path: '/privacy',     color: 'text-slate-400'   },
  ]

  const handleNav = (path) => { navigate(path); onClose() }
  const handleSignOut = async () => { await signOut(); onClose(); navigate('/') }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col"
          >
            <div className="absolute inset-0 bg-[#080F1E] border-r border-white/10" />
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400/0 via-amber-400/60 to-amber-400/0" />

            <div className="relative flex flex-col h-full p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-white text-lg">WC 2026 Hub</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* User Card */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => handleNav('/profile')}
                className="mb-8 p-4 glass rounded-2xl cursor-pointer hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xl font-black text-black shadow-lg shadow-amber-500/20 flex-shrink-0">
                    {profile?.username?.[0]?.toUpperCase() ?? (user ? user.email?.[0]?.toUpperCase() : '?')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">
                      {profile?.username ?? (user ? user.email?.split('@')[0] : 'Guest')}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user ? user.email : t.sidebar.notSignedIn}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 ml-auto" />
                </div>
              </motion.div>

              {/* Nav items */}
              <nav className="flex-1 space-y-1">
                {navItems.map((item, i) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.2, ease: 'easeOut' }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNav(item.path)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </nav>

              {/* Bottom */}
              <div className="pt-4 border-t border-white/5">
                {user ? (
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{t.sidebar.signOut}</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => handleNav('/auth')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span className="font-medium">{t.sidebar.signIn}</span>
                  </motion.button>
                )}
                <p className="text-center text-xs text-slate-700 mt-4">WC 2026 Hub v0.1.0</p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
