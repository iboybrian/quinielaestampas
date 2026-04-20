import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, ShieldAlert } from 'lucide-react'
import { useQuinielaGroup, updateQuiniela, toggleMemberPaid } from '../hooks/useQuiniela'
import { useLang } from '../contexts/LangContext'
import PageTransition from '../components/layout/PageTransition'

export default function ManageQuiniela() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { quiniela, members, loading, isAdmin, refresh } = useQuinielaGroup(id)

  const [activeTab, setActiveTab] = useState('participants')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings form state
  const [deadline, setDeadline] = useState(10)
  const [entryFee, setEntryFee] = useState('')
  const [participantLimit, setParticipantLimit] = useState('')
  const [description, setDescription] = useState('')
  const [infoContact, setInfoContact] = useState('')

  useEffect(() => {
    if (quiniela) {
      setDeadline(quiniela.prediction_deadline_minutes ?? 10)
      setEntryFee(quiniela.entry_fee != null ? String(quiniela.entry_fee) : '')
      setParticipantLimit(quiniela.participant_limit != null ? String(quiniela.participant_limit) : '')
      setDescription(quiniela.description ?? '')
      setInfoContact(quiniela.info_contact ?? '')
    }
  }, [quiniela])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateQuiniela(id, {
        prediction_deadline_minutes: Number(deadline),
        entry_fee: entryFee !== '' ? Number(entryFee) : null,
        participant_limit: participantLimit !== '' ? Number(participantLimit) : null,
        description: description.trim() || null,
        info_contact: infoContact.trim() || null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePaid = async (memberId, current) => {
    try {
      await toggleMemberPaid(id, memberId, !current)
      await refresh()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
        </div>
      </PageTransition>
    )
  }

  if (!isAdmin) {
    return (
      <PageTransition>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400 mb-6">{t.admin.notAdmin}</p>
          <button onClick={() => navigate(`/quiniela/${id}`)} className="btn-secondary px-5 py-2.5 text-sm">
            {t.admin.backToGroup}
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(`/quiniela/${id}`)}
            className="w-9 h-9 flex items-center justify-center rounded-xl glass hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-white">{t.admin.title}</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{quiniela?.name}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
          {['participants', 'settings'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {t.admin.tabs[tab]}
            </button>
          ))}
        </div>

        {/* Participants tab */}
        {activeTab === 'participants' && (
          <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            {members.length === 0 ? (
              <p className="text-center text-slate-500 py-12">{t.admin.noParticipants}</p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 glass rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center font-black text-amber-400 text-sm flex-shrink-0">
                      {(member.username ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">
                        {member.username ?? member.id.slice(0, 8)}
                      </div>
                      {member.role === 'admin' && (
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Admin</div>
                      )}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTogglePaid(member.id, member.hasPaid)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        member.hasPaid
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {member.hasPaid && <Check className="w-3 h-3" />}
                      {member.hasPaid ? t.admin.paid : t.admin.notPaid}
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings tab */}
        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.deadlineLabel}</label>
                <input
                  type="number" min={0} max={120} value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.entryFeeLabel}</label>
                <input
                  type="number" min={0} step={0.01} value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value)}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.limitLabel}</label>
                <input
                  type="number" min={2} value={participantLimit}
                  onChange={(e) => setParticipantLimit(e.target.value)}
                  placeholder="—"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.descriptionLabel}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3} maxLength={300}
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.contactLabel}</label>
                <input
                  type="text" value={infoContact}
                  onChange={(e) => setInfoContact(e.target.value)}
                  maxLength={200}
                  className="input-field"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSaveSettings}
                disabled={saving}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{t.admin.saving}</>
                  : saved
                  ? <><Check className="w-4 h-4" />{t.admin.saved}</>
                  : t.admin.saveSettings
                }
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
