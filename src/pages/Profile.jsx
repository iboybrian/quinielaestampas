import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Edit3, Save, LogIn, Trophy, Star, Target, Loader2, Bell, BellOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useMyCollection } from '../hooks/useStickers'
import { useMyQuinielas } from '../hooks/useQuiniela'
import { usePushNotifications } from '../hooks/usePushNotifications'
import PageTransition from '../components/layout/PageTransition'

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, loading: authLoading } = useAuth()
  const { t } = useLang()
  const { stats: stickerStats } = useMyCollection()
  const { quinielas } = useMyQuinielas()
  const { supported: pushSupported, subscribed: pushOn, loading: pushLoading, toggle: togglePush } = usePushNotifications()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username ?? '')
  const [country, setCountry] = useState(profile?.country ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ username: username.trim(), country: country.trim() })
      setEditing(false)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        </div>
      </PageTransition>
    )
  }

  if (!user) {
    return (
      <PageTransition>
        <div className="max-w-sm mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-5">👤</div>
          <h2 className="text-2xl font-black text-white mb-2">{t.profile.signInTitle}</h2>
          <p className="text-slate-400 mb-8">{t.profile.signInDesc}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth')}
            className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" />
            {t.profile.signInBtn}
          </motion.button>
        </div>
      </PageTransition>
    )
  }

  const displayName = profile?.username ?? user.email?.split('@')[0] ?? 'User'
  const letter = displayName[0]?.toUpperCase() ?? '?'

  const quickActions = [
    { label: t.profile.openAlbum,   path: '/marketplace', color: 'hover:border-amber-400/20'  },
    { label: t.profile.myQuinielas, path: '/quiniela',    color: 'hover:border-emerald-400/20' },
    { label: t.profile.privacy,     path: '/privacy',     color: 'hover:border-slate-400/20'   },
  ]

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full scale-125" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-4xl font-black text-black shadow-2xl shadow-amber-500/30">
              {letter}
            </div>
          </div>

          {editing ? (
            <div className="w-full max-w-xs space-y-3 mb-4">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder={t.profile.username} className="input-field text-center" maxLength={30} />
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                placeholder={t.profile.country} className="input-field text-center" maxLength={40} />
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 btn-secondary py-2.5 text-sm">
                  {t.profile.cancel}
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
                  className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-1">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t.profile.save}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center mb-4">
              <h1 className="text-2xl font-black text-white">{displayName}</h1>
              {profile?.country && <p className="text-slate-500 text-sm mt-0.5">{profile.country}</p>}
              <p className="text-slate-600 text-xs mt-1">{user.email}</p>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => { setUsername(profile?.username ?? ''); setCountry(profile?.country ?? ''); setEditing(true) }}
                className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors mx-auto">
                <Edit3 className="w-3.5 h-3.5" />
                {t.profile.editProfile}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25, ease: 'easeOut' }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          <StatCard icon={Star}   value={stickerStats.owned}  label={t.profile.stickers}  color="text-amber-400"  />
          <StatCard icon={Trophy} value={quinielas.length}    label={t.profile.quinielas} color="text-purple-400" />
          <StatCard icon={Target} value={stickerStats.needed} label={t.profile.wanted}    color="text-emerald-400" />
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.25, ease: 'easeOut' }}
          className="space-y-3"
        >
          <h2 className="font-bold text-white mb-3">{t.profile.quickActions}</h2>
          {quickActions.map((action) => (
            <motion.button
              key={action.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={`w-full glass rounded-2xl p-4 text-left font-semibold text-white text-sm transition-all ${action.color}`}
            >
              {action.label}
            </motion.button>
          ))}

          {pushSupported && (
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={togglePush}
              disabled={pushLoading}
              className={`w-full glass rounded-2xl p-4 text-left font-semibold text-sm transition-all flex items-center gap-3 ${
                pushOn
                  ? 'text-amber-400 hover:border-amber-400/20'
                  : 'text-slate-400 hover:border-slate-400/20'
              }`}
            >
              {pushLoading
                ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                : pushOn
                  ? <Bell className="w-4 h-4 flex-shrink-0" />
                  : <BellOff className="w-4 h-4 flex-shrink-0" />
              }
              {pushOn ? t.profile.notificationsOn : t.profile.notificationsOff}
            </motion.button>
          )}
        </motion.div>
      </div>
    </PageTransition>
  )
}
