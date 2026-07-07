import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Loader2, ShieldAlert, Trash2, AlertTriangle } from 'lucide-react'
import { useQuinielaGroup, updateQuiniela, toggleMemberPaid, removeMember, deleteQuiniela } from '../hooks/useQuiniela'
import { useLang } from '../contexts/LangContext'
import { useAuth } from '../contexts/AuthContext'
import PageTransition from '../components/layout/PageTransition'

export default function ManageQuiniela() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { user } = useAuth()
  const { quiniela, members, predictions, loading, isAdmin, refresh } = useQuinielaGroup(id)

  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') === 'settings' ? 'settings' : 'participants')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null) // { memberId, username }
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Settings form state
  const [name, setName] = useState('')
  const [deadline, setDeadline] = useState(10)
  const [entryFee, setEntryFee] = useState('')
  const [participantLimit, setParticipantLimit] = useState('')
  const [description, setDescription] = useState('')
  const [infoContact, setInfoContact] = useState('')
  const [extraPointsEnabled, setExtraPointsEnabled] = useState(false)
  const [closeAtPhase, setCloseAtPhase] = useState(null)

  useEffect(() => {
    if (quiniela) {
      setName(quiniela.name ?? '')
      setDeadline(quiniela.prediction_deadline_minutes ?? 10)
      setEntryFee(quiniela.entry_fee != null ? String(quiniela.entry_fee) : '')
      setParticipantLimit(quiniela.participant_limit != null ? String(quiniela.participant_limit) : '')
      setDescription(quiniela.description ?? '')
      setInfoContact(quiniela.info_contact ?? '')
      setExtraPointsEnabled(quiniela.extra_points_enabled ?? false)
      setCloseAtPhase(quiniela.close_at_phase ?? null)
    }
  }, [quiniela])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await updateQuiniela(id, {
        ...(name.trim() && { name: name.trim() }),
        prediction_deadline_minutes: Number(deadline),
        entry_fee: entryFee !== '' ? Number(entryFee) : null,
        participant_limit: participantLimit !== '' ? Number(participantLimit) : null,
        description: description.trim() || null,
        info_contact: infoContact.trim() || null,
        extra_points_enabled: extraPointsEnabled,
        close_at_phase: closeAtPhase,
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

  const handleDeleteQuiniela = async () => {
    setDeleting(true)
    try {
      await deleteQuiniela(id)
      navigate('/quiniela')
    } catch (e) {
      alert(e.message)
      setDeleting(false)
    }
  }

  const handleConfirmRemove = async () => {
    if (!confirmModal) return
    setRemoving(true)
    try {
      await removeMember(id, confirmModal.memberId)
      setConfirmModal(null)
      await refresh()
    } catch (e) {
      alert(e.message)
    } finally {
      setRemoving(false)
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
                    {member.id !== user?.id && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setConfirmModal({ memberId: member.id, username: member.username ?? member.id.slice(0, 8) })}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
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

              {/* Puntos Extra — shown first */}
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-amber-400">⚡ {t.admin.featureExtraPointsLabel}</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {t.admin.extraPointsDesc}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: false, label: t.admin.extraPointsOff,  desc: t.admin.extraPointsOffDesc },
                    { value: true,  label: t.admin.extraPointsOn,   desc: t.admin.extraPointsOnDesc },
                  ].map(opt => (
                    <motion.button
                      key={String(opt.value)}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setExtraPointsEnabled(opt.value)}
                      className={`py-3 px-3 rounded-xl border text-left transition-colors ${
                        extraPointsEnabled === opt.value
                          ? 'bg-amber-400/20 border-amber-400/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-xs font-black mb-0.5 ${extraPointsEnabled === opt.value ? 'text-amber-300' : 'text-slate-300'}`}>{opt.label}</div>
                      <div className="text-[10px] text-slate-500">{opt.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Fase de cierre */}
              <div className="rounded-2xl border border-slate-500/20 bg-white/3 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-black text-slate-300">🔒 {t.admin.closeAtPhaseLabel}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{t.admin.closeAtPhaseDesc}</p>
                <div className="space-y-1.5">
                  {[
                    { value: null,    label: t.admin.closeAtPhaseOptions.none },
                    { value: 'r16',   label: t.admin.closeAtPhaseOptions.r16 },
                    { value: 'qf',    label: t.admin.closeAtPhaseOptions.qf },
                    { value: 'sf',    label: t.admin.closeAtPhaseOptions.sf },
                    { value: 'final', label: t.admin.closeAtPhaseOptions.final },
                  ].map((opt) => {
                    const selected = closeAtPhase === opt.value
                    return (
                      <motion.button
                        key={String(opt.value)}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCloseAtPhase(opt.value)}
                        className={`w-full py-3 px-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          selected
                            ? 'bg-emerald-500/15 border-emerald-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          selected ? 'border-emerald-400 bg-emerald-400' : 'border-slate-600'
                        }`}>
                          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${selected ? 'text-emerald-300' : 'text-slate-400'}`}>
                          {opt.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">{t.admin.nameLabel}</label>
                <input
                  type="text" value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="input-field"
                />
              </div>


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

              {/* Danger zone */}
              <div className="mt-4 border border-red-500/20 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">{t.admin.deleteZone}</p>
                <p className="text-xs text-slate-500 mb-3">{t.admin.deleteDesc}</p>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDeleteModal(true)}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-bold hover:bg-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.admin.deleteBtn}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Delete quiniela confirmation modal */}
      <AnimatePresence>
        {deleteModal && (() => {
          const otherMembers = members.filter(m => m.id !== user?.id)
          const hasPoints = predictions.some(p => p.points_earned != null && p.points_earned > 0)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => !deleting && setDeleteModal(false)}
              />
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                  className="w-full max-w-sm bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="font-black text-white text-base">{t.admin.confirmDeleteTitle}</h3>
                  </div>
                  <div className="space-y-2 mb-6">
                    {hasPoints && (
                      <p className="text-sm text-red-400 font-semibold">{t.admin.deleteWarningPoints}</p>
                    )}
                    {otherMembers.length > 0 && (
                      <p className="text-sm text-amber-400">{t.admin.deleteWarningMembers.replace('{n}', otherMembers.length)}</p>
                    )}
                    <p className="text-sm text-slate-400">{t.admin.deleteIrreversible}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModal(false)}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {t.authGate?.cancel ?? 'Cancelar'}
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDeleteQuiniela}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t.admin.deleting}</>
                        : <><Trash2 className="w-3.5 h-3.5" />{t.admin.deleteBtn}</>
                      }
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* Remove member confirmation modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !removing && setConfirmModal(null)}
            />
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
                className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">{t.admin.removeMember}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{confirmModal.username}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-6">
                  {t.admin.confirmRemove.replace('{name}', confirmModal.username)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    disabled={removing}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    {t.authGate?.cancel ?? 'Cancelar'}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmRemove}
                    disabled={removing}
                    className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {removing
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{t.admin.removing}</>
                      : <><Trash2 className="w-3.5 h-3.5" />{t.admin.removeMember}</>
                    }
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
