import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Zap, Trophy, Target, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../contexts/LangContext'

const MODAL_KEY = 'admin_feature_modal_v1_seen'

function dismiss(setFn) {
  localStorage.setItem(MODAL_KEY, '1')
  setFn(true)
}

export default function AdminFeatureModal({ quinielaId, isAdmin }) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(MODAL_KEY))
  const { t, lang, toggle } = useLang()
  const ta = t.admin

  const shouldShow = !!isAdmin && !!quinielaId && !dismissed

  const handleGoToSettings = () => {
    dismiss(setDismissed)
    navigate(`/quiniela/${quinielaId}/manage?tab=settings`)
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismiss(setDismissed)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal — wider, capped height, flex column */}
          <div className="relative z-10 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="w-full bg-[#0A1628] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]"
            >
              {/* Amber glow top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

              {/* Header — fixed, not scrollable */}
              <div className="flex-shrink-0 pt-5 px-6 pb-3 relative">
                {/* Lang toggle + close */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={toggle}
                    className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {lang === 'es' ? 'EN' : 'ES'}
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => dismiss(setDismissed)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Hero icon */}
                <div className="flex justify-center mb-3">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 border border-amber-400/30 flex items-center justify-center"
                  >
                    <Zap className="w-6 h-6 text-amber-400" />
                  </motion.div>
                </div>

                <h2 className="text-lg font-black text-white text-center mb-0.5">{ta.featureModalTitle}</h2>
                <p className="text-xs text-amber-400 font-semibold text-center">{ta.featureModalSubtitle}</p>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
                {/* Feature items */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Trophy className="w-3 h-3 text-amber-400" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-white font-semibold">{ta.featureExtraPointsLabel}:</span>{' '}
                      <span dangerouslySetInnerHTML={{ __html: ta.featureModalExtraPoints }} />
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-white font-semibold">{ta.closeAtPhaseLabel}:</span>{' '}
                      <span dangerouslySetInnerHTML={{ __html: ta.featureModalClosePhase }} />
                    </p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Target className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span dangerouslySetInnerHTML={{ __html: ta.featureModalBanner }} />
                    </p>
                  </div>
                </div>

                {/* Important notice */}
                <div className="border border-amber-500/20 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">⚠️ {ta.featureModalImportantLabel}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{ta.featureModalImportantBody}</p>
                </div>

                {/* Save reminder */}
                <div className="bg-amber-400/10 border border-amber-400/25 rounded-xl px-3 py-2.5">
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    <span dangerouslySetInnerHTML={{ __html: ta.featureModalHint }} />
                  </p>
                </div>
              </div>

              {/* Buttons — fixed at bottom, never scrolls away */}
              <div className="flex-shrink-0 px-6 pt-3 pb-5 flex gap-3 border-t border-white/5">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => dismiss(setDismissed)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 font-medium text-sm transition-colors"
                >
                  {ta.featureModalLater}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGoToSettings}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
                >
                  {ta.featureModalGoSettings}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
