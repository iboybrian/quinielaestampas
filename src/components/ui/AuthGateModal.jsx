import { motion, AnimatePresence } from 'framer-motion'
import { Lock, UserPlus, LogIn, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'

// Floating modal shown when a guest tries to use a feature that requires an
// account. Dismissable (X, backdrop click, Cancel). The trigger callsite supplies
// `title` / `message` for context-specific copy; sensible defaults if omitted.
export default function AuthGateModal({ open, onClose, title, message }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const g = t.authGate

  const goAuth = () => {
    onClose()
    navigate('/auth')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
          />

          {/* Modal centering wrapper */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full max-w-sm pointer-events-auto"
            >
              <div className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 shadow-2xl">
              {/* Decorative lock watermark */}
              <div className="absolute -top-6 -right-6 opacity-[0.06] pointer-events-none">
                <Lock className="w-32 h-32 text-amber-400" strokeWidth={1.5} />
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Lock icon */}
              <div className="relative w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-amber-300" />
              </div>

              {/* Copy */}
              <h2 className="relative text-xl font-black text-white mb-2">
                {title ?? g.title}
              </h2>
              <p className="relative text-sm text-slate-300 leading-relaxed mb-5">
                {message ?? g.defaultMessage}
              </p>

              {/* Actions */}
              <div className="relative flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goAuth}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-sm hover:bg-amber-300 transition-colors shadow-lg shadow-amber-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  {g.signUp}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={goAuth}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  {g.signIn}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors mt-1"
                >
                  {g.cancel}
                </button>
              </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
