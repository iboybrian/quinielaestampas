import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Globe, Search, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import PageTransition from '../components/layout/PageTransition'

const COUNTRIES = [
  { flag: '🇦🇱', name: 'Albania' }, { flag: '🇩🇿', name: 'Algeria' }, { flag: '🇦🇴', name: 'Angola' },
  { flag: '🇦🇷', name: 'Argentina' }, { flag: '🇦🇲', name: 'Armenia' }, { flag: '🇦🇺', name: 'Australia' },
  { flag: '🇦🇹', name: 'Austria' }, { flag: '🇦🇿', name: 'Azerbaijan' }, { flag: '🇧🇭', name: 'Bahrain' },
  { flag: '🇧🇩', name: 'Bangladesh' }, { flag: '🇧🇪', name: 'Belgium' }, { flag: '🇧🇴', name: 'Bolivia' },
  { flag: '🇧🇦', name: 'Bosnia & Herzegovina' }, { flag: '🇧🇷', name: 'Brazil' }, { flag: '🇧🇬', name: 'Bulgaria' },
  { flag: '🇨🇲', name: 'Cameroon' }, { flag: '🇨🇦', name: 'Canada' }, { flag: '🇨🇱', name: 'Chile' },
  { flag: '🇨🇳', name: 'China' }, { flag: '🇨🇴', name: 'Colombia' }, { flag: '🇨🇷', name: 'Costa Rica' },
  { flag: '🇭🇷', name: 'Croatia' }, { flag: '🇨🇺', name: 'Cuba' }, { flag: '🇨🇿', name: 'Czech Republic' },
  { flag: '🇨🇩', name: 'DR Congo' }, { flag: '🇩🇰', name: 'Denmark' }, { flag: '🇪🇨', name: 'Ecuador' },
  { flag: '🇪🇬', name: 'Egypt' }, { flag: '🇸🇻', name: 'El Salvador' }, { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England' },
  { flag: '🇫🇮', name: 'Finland' }, { flag: '🇫🇷', name: 'France' }, { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇬🇭', name: 'Ghana' }, { flag: '🇬🇷', name: 'Greece' }, { flag: '🇬🇹', name: 'Guatemala' },
  { flag: '🇭🇳', name: 'Honduras' }, { flag: '🇭🇺', name: 'Hungary' }, { flag: '🇮🇩', name: 'Indonesia' },
  { flag: '🇮🇷', name: 'Iran' }, { flag: '🇮🇶', name: 'Iraq' }, { flag: '🇮🇪', name: 'Ireland' },
  { flag: '🇮🇱', name: 'Israel' }, { flag: '🇮🇹', name: 'Italy' }, { flag: '🇨🇮', name: 'Ivory Coast' },
  { flag: '🇯🇲', name: 'Jamaica' }, { flag: '🇯🇵', name: 'Japan' }, { flag: '🇯🇴', name: 'Jordan' },
  { flag: '🇰🇿', name: 'Kazakhstan' }, { flag: '🇰🇪', name: 'Kenya' }, { flag: '🇰🇼', name: 'Kuwait' },
  { flag: '🇲🇽', name: 'Mexico' }, { flag: '🇲🇦', name: 'Morocco' }, { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇳🇿', name: 'New Zealand' }, { flag: '🇳🇬', name: 'Nigeria' }, { flag: '🇳🇴', name: 'Norway' },
  { flag: '🇴🇲', name: 'Oman' }, { flag: '🇵🇦', name: 'Panama' }, { flag: '🇵🇾', name: 'Paraguay' },
  { flag: '🇵🇪', name: 'Peru' }, { flag: '🇵🇭', name: 'Philippines' }, { flag: '🇵🇱', name: 'Poland' },
  { flag: '🇵🇹', name: 'Portugal' }, { flag: '🇶🇦', name: 'Qatar' }, { flag: '🇷🇴', name: 'Romania' },
  { flag: '🇷🇺', name: 'Russia' }, { flag: '🇸🇦', name: 'Saudi Arabia' }, { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', name: 'Scotland' },
  { flag: '🇸🇳', name: 'Senegal' }, { flag: '🇷🇸', name: 'Serbia' }, { flag: '🇸🇰', name: 'Slovakia' },
  { flag: '🇸🇮', name: 'Slovenia' }, { flag: '🇿🇦', name: 'South Africa' }, { flag: '🇰🇷', name: 'South Korea' },
  { flag: '🇪🇸', name: 'Spain' }, { flag: '🇸🇪', name: 'Sweden' }, { flag: '🇨🇭', name: 'Switzerland' },
  { flag: '🇹🇳', name: 'Tunisia' }, { flag: '🇹🇷', name: 'Turkey' }, { flag: '🇦🇪', name: 'UAE' },
  { flag: '🇺🇦', name: 'Ukraine' }, { flag: '🇺🇸', name: 'United States' }, { flag: '🇺🇾', name: 'Uruguay' },
  { flag: '🇻🇪', name: 'Venezuela' }, { flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', name: 'Wales' }, { flag: '🇾🇪', name: 'Yemen' },
  { flag: '🇿🇲', name: 'Zambia' }, { flag: '🇿🇼', name: 'Zimbabwe' },
]

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

function CountrySelect({ value, onChange, open, setOpen, t }) {
  const ref = useRef(null)
  const searchRef = useRef(null)
  const [query, setQuery] = useState('')
  const selected = COUNTRIES.find(c => c.name === value)
  const filtered = query.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES

  useEffect(() => {
    if (!open) { setQuery(''); return }
    const timer = setTimeout(() => searchRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, setOpen])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-left cursor-pointer transition-colors"
      >
        <span className="shrink-0 text-slate-500 flex items-center justify-center w-5">
          {selected ? <span className="text-sm leading-none">{selected.flag}</span> : <Globe className="w-3.5 h-3.5" />}
        </span>
        <span className={`flex-1 text-sm ${selected ? 'text-white' : 'text-slate-500'}`}>
          {selected ? selected.name : t.auth.selectCountry}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-slate-500"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.auth.searchCountry}
                  className="w-full bg-white/5 rounded-lg pl-8 pr-7 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:bg-white/10 transition-colors"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-44 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-500 text-center">{t.auth.noCountries}</li>
              ) : (
                filtered.map((c) => (
                  <li key={c.name}>
                    <button
                      type="button"
                      onClick={() => { onChange(c.name); setOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
                        value === c.name ? 'bg-amber-500/15 text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-sm w-5 text-center shrink-0">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      {value === c.name && <span className="text-amber-400 text-xs">✓</span>}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const { t } = useLang()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [countryOpen, setCountryOpen] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        navigate('/')
      } else {
        if (!username.trim()) { setError(t.auth.usernameRequired); setLoading(false); return }
        if (!country) { setError(t.auth.countryRequired); setLoading(false); return }
        await signUp(email, password, username.trim(), country)
        setSuccess(t.auth.successMsg)
        setMode('login')
      }
    } catch (err) {
      setError(err.message ?? t.auth.somethingWrong)
    } finally {
      setLoading(false)
    }
  }

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
            transition={{ duration: 0.25 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.auth.back}
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-center mb-8"
          >
            <div className="text-5xl mb-3">🏆</div>
            <h1 className="text-2xl font-black text-white">
              WC <span className="gold-text">2026</span> Hub
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.25, ease: 'easeOut' }}
            className="glass rounded-3xl p-7"
          >
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-7">
              {[['login', t.auth.signIn], ['register', t.auth.createAccount]].map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === m ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-4"
                    style={{ overflow: countryOpen ? 'visible' : 'hidden' }}
                  >
                    <InputField icon={User} placeholder={t.auth.username} value={username} onChange={(e) => setUsername(e.target.value)} />
                    <CountrySelect value={country} onChange={setCountry} open={countryOpen} setOpen={setCountryOpen} t={t} />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField icon={Mail} type="email" placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} />

              <InputField
                icon={Lock}
                type={showPass ? 'text' : 'password'}
                placeholder={t.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightEl={
                  <button type="button" onClick={() => setShowPass(p => !p)} className="text-slate-500 hover:text-white p-1">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-400">
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={loading || !email || !password}
                className="btn-primary w-full py-3.5 mt-2"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      {t.auth.loading}
                    </span>
                  : mode === 'login' ? t.auth.signIn : t.auth.createAccount
                }
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  )
}
