import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Key, Trophy, Copy, Check, ChevronRight, Users, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../contexts/LangContext'
import { useMyQuinielas, createQuiniela, joinQuiniela } from '../hooks/useQuiniela'
import PageTransition from '../components/layout/PageTransition'

function QuinielaCard({ quiniela }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/quiniela/${quiniela.id}`)}
      className="flex items-center gap-4 glass rounded-2xl p-4 cursor-pointer hover:border-white/20 transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/20 flex items-center justify-center text-2xl flex-shrink-0">
        🎯
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{quiniela.name}</div>
        <div className="text-xs text-slate-500 mt-0.5 font-mono">Code: {quiniela.code}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
    </motion.div>
  )
}

function CreateForm({ onDone }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!name.trim() || !user) return
    setLoading(true)
    try {
      const q = await createQuiniela(name.trim(), user.id)
      setCreated(q)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(created.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (created) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-black text-white mb-1">{created.name}</h3>
        <p className="text-slate-400 text-sm mb-6">{t.quiniela.shareCode}</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="text-4xl font-black text-white tracking-[0.3em] font-mono mb-3">{created.code}</div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={copyCode}
            className="flex items-center gap-2 mx-auto text-sm text-slate-400 hover:text-white transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? t.quiniela.copied : t.quiniela.copyCode}
          </motion.button>
        </div>
        <button onClick={onDone} className="btn-primary w-full py-3">{t.quiniela.enterGroup}</button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder={t.quiniela.groupName} className="input-field" maxLength={40} />
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
        disabled={!name.trim() || loading || !user} className="btn-primary w-full py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.quiniela.createBtn}
      </motion.button>
      {!user && <p className="text-center text-xs text-slate-500">{t.quiniela.signInCreate}</p>}
    </div>
  )
}

function JoinForm({ onDone: _onDone }) {
  const { user } = useAuth()
  const { t } = useLang()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleJoin = async () => {
    if (!code.trim() || !user) return
    setLoading(true)
    try {
      const q = await joinQuiniela(code.trim(), user.id)
      navigate(`/quiniela/${q.id}`)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={t.quiniela.enterCode}
        className="input-field text-center text-2xl font-black tracking-widest font-mono uppercase"
        maxLength={6} />
      <motion.button whileTap={{ scale: 0.97 }} onClick={handleJoin}
        disabled={code.length < 6 || loading || !user} className="btn-emerald w-full py-3">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.quiniela.joinBtn}
      </motion.button>
      {!user && <p className="text-center text-xs text-slate-500">{t.quiniela.signInJoin}</p>}
    </div>
  )
}

export default function QuinielaHub() {
  const [activeTab, setActiveTab] = useState(null)
  const { quinielas, loading, refresh } = useMyQuinielas()
  const { t } = useLang()

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="text-3xl font-black text-white">{t.quiniela.title}</h1>
          <p className="text-slate-400 mt-1">{t.quiniela.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(activeTab === 'create' ? null : 'create')}
            className={`glass rounded-2xl p-5 text-left transition-all ${activeTab === 'create' ? 'border-amber-400/30 bg-amber-400/5' : 'hover:border-white/20'}`}
          >
            <Plus className={`w-6 h-6 mb-3 ${activeTab === 'create' ? 'text-amber-400' : 'text-slate-400'}`} />
            <div className="font-bold text-white">{t.quiniela.create}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.quiniela.createDesc}</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(activeTab === 'join' ? null : 'join')}
            className={`glass rounded-2xl p-5 text-left transition-all ${activeTab === 'join' ? 'border-emerald-400/30 bg-emerald-400/5' : 'hover:border-white/20'}`}
          >
            <Key className={`w-6 h-6 mb-3 ${activeTab === 'join' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <div className="font-bold text-white">{t.quiniela.join}</div>
            <div className="text-xs text-slate-500 mt-0.5">{t.quiniela.joinDesc}</div>
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden mb-8"
            >
              <div className={`glass rounded-2xl p-6 border ${activeTab === 'create' ? 'border-amber-400/20' : 'border-emerald-400/20'}`}>
                <h3 className="font-bold text-white mb-5">
                  {activeTab === 'create' ? t.quiniela.createTitle : t.quiniela.joinTitle}
                </h3>
                {activeTab === 'create'
                  ? <CreateForm onDone={() => { setActiveTab(null); refresh() }} />
                  : <JoinForm onDone={() => setActiveTab(null)} />
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-white">{t.quiniela.myGroups}</h2>
            {quinielas.length > 0 && (
              <span className="text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">{quinielas.length}</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {t.quiniela.loading}
            </div>
          ) : quinielas.length === 0 ? (
            <div className="text-center py-10 glass rounded-2xl">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500 text-sm">{t.quiniela.noGroups}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quinielas.map((q) => <QuinielaCard key={q.id} quiniela={q} />)}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
