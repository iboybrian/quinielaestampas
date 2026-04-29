import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../lib/supabase'
import PageTransition from '../components/layout/PageTransition'

function InputField({ icon: Icon, type = 'text', placeholder, value, onChange, rightEl }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
        <Icon className="w-4 h-4" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-11 pr-11"
      />
      {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
  )
}

// ── Request view — send reset email ──────────────────────────────────────────

function RequestView({ t }) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err.message ?? t.auth.somethingWrong)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <p className="text-white font-bold mb-2">{t.auth.resetSent}</p>
        <Link to="/auth" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
          {t.auth.signIn}
        </Link>
      </motion.div>
    )
  }

  return (
    <>
      <p className="text-slate-400 text-sm mb-6 text-center">{t.auth.resetDesc}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={Mail}
          type="email"
          placeholder={t.auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={loading || !email.trim()}
          className="btn-primary w-full py-3.5"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {t.auth.loading}
              </span>
            : t.auth.sendReset
          }
        </motion.button>
      </form>
    </>
  )
}

// ── Update view — set new password ───────────────────────────────────────────

function UpdateView({ t }) {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError(t.auth.passwordTooShort); return }
    if (password !== confirm)  { setError(t.auth.passwordMismatch);  return }
    setLoading(true)
    try {
      await updatePassword(password)
      // Sign out recovery session, redirect to auth
      setTimeout(() => navigate('/auth'), 1500)
    } catch (err) {
      setError(err.message ?? t.auth.somethingWrong)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="text-slate-400 text-sm mb-6 text-center">{t.auth.updateDesc}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          icon={Lock}
          type={showPass ? 'text' : 'password'}
          placeholder={t.auth.newPassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightEl={
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="text-slate-500 hover:text-white p-1">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <InputField
          icon={Lock}
          type={showPass ? 'text' : 'password'}
          placeholder={t.auth.confirmPassword}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={loading || !password || !confirm}
          className="btn-primary w-full py-3.5"
        >
          {loading
            ? <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {t.auth.loading}
              </span>
            : t.auth.updatePassword
          }
        </motion.button>
      </form>
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResetPassword() {
  const { t } = useLang()
  const navigate = useNavigate()
  // 'request' → send email | 'update' → set new password (arrived from email link)
  const [view, setView] = useState('request')

  useEffect(() => {
    // Detect PASSWORD_RECOVERY event fired by Supabase when user lands from email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setView('update')
    })

    // Also handle initial load if hash already processed before listener attached
    if (window.location.hash.includes('type=recovery')) setView('update')

    return () => subscription.unsubscribe()
  }, [])

  const title = view === 'update' ? t.auth.updateTitle : t.auth.resetTitle

  return (
    <PageTransition>
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/6 rounded-full blur-3xl animate-float" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.auth.back}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-3">🔑</div>
            <h1 className="text-2xl font-black text-white">{title}</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, ease: 'easeOut' }}
            className="glass rounded-3xl p-7"
          >
            <AnimatePresence mode="wait">
              {view === 'request' ? (
                <motion.div key="request" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RequestView t={t} />
                </motion.div>
              ) : (
                <motion.div key="update" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <UpdateView t={t} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {view === 'request' && (
            <p className="text-center text-xs text-slate-600 mt-4">
              <Link to="/auth" className="hover:text-slate-400 transition-colors">{t.auth.signIn}</Link>
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
