import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, BookOpen, Loader2 } from 'lucide-react'
import { TEAMS, ALL_STICKERS, SPECIAL_STICKERS } from '../lib/stickerData'
import { useMyCollection } from '../hooks/useStickers'
import { useLang } from '../contexts/LangContext'
import StickerCard from '../components/marketplace/StickerCard'
import TradeMatcher from '../components/marketplace/TradeMatcher'
import TradeChat from '../components/marketplace/TradeChat'
import AchievementOverlay, { useAchievements } from '../components/animations/AchievementOverlay'
import PageTransition from '../components/layout/PageTransition'

const FILTER_KEYS = ['All', 'Have', 'Needed', 'Missing']

function TeamTab({ team, isActive, ownedCount, totalCount, onClick }) {
  const pct = Math.round((ownedCount / totalCount) * 100)
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
        isActive
          ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span>{team.flag}</span>
        <span>{team.code}</span>
      </div>
      <div className={`h-1 rounded-full mt-1.5 ${isActive ? 'bg-amber-400/30' : 'bg-white/10'}`}>
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : isActive ? 'bg-amber-400' : 'bg-white/30'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`text-[9px] mt-1 ${pct === 100 ? 'text-emerald-400' : 'text-slate-600'}`}>
        {ownedCount}/{totalCount}
      </div>
    </motion.button>
  )
}

export default function Marketplace() {
  const { t } = useLang()
  const [mainTab, setMainTab] = useState('My Album')
  const [selectedTeam, setSelectedTeam] = useState('ALL')
  const [filter, setFilter] = useState('All')
  const [chatPartner, setChatPartner] = useState(null)
  const { collection, loading, toggleHave, toggleNeed, hasSticker, needsSticker, stats } = useMyCollection()
  const { achievement, trigger: triggerAchievement, dismiss: dismissAchievement } = useAchievements()

  const MAIN_TABS = [
    { key: 'My Album', label: t.marketplace.myAlbum, icon: BookOpen       },
    { key: 'Trade',    label: t.marketplace.trade,   icon: ArrowRightLeft  },
  ]

  const handleToggleHave = async (stickerId) => {
    const wasHave = hasSticker(stickerId)
    await toggleHave(stickerId)
    if (!wasHave) {
      const sticker = ALL_STICKERS.find((s) => s.id === stickerId)
      if (sticker?.teamCode && sticker.teamCode !== 'SPEC') {
        const teamStickers = ALL_STICKERS.filter((s) => s.teamCode === sticker.teamCode)
        const ownedAfter = teamStickers.filter((s) => s.id === stickerId || hasSticker(s.id)).length
        if (ownedAfter === teamStickers.length) {
          const team = TEAMS.find((tm) => tm.code === sticker.teamCode)
          triggerAchievement('team_complete', `${team?.flag} ${team?.name} Complete!`, 'You collected all stickers for this team!')
        }
      }
      if (sticker?.rarity === 'legendary') {
        triggerAchievement('legendary', sticker.name, 'Legendary sticker added to your album!')
      }
    }
  }

  const displayedStickers = useMemo(() => {
    let stickers = selectedTeam === 'ALL'
      ? ALL_STICKERS
      : selectedTeam === 'SPEC'
      ? SPECIAL_STICKERS.map((s) => ({ ...s, teamCode: 'SPEC', type: 'special' }))
      : ALL_STICKERS.filter((s) => s.teamCode === selectedTeam)

    switch (filter) {
      case 'Have':    stickers = stickers.filter((s) => hasSticker(s.id));  break
      case 'Needed':  stickers = stickers.filter((s) => needsSticker(s.id)); break
      case 'Missing': stickers = stickers.filter((s) => !hasSticker(s.id)); break
      default: break
    }
    return stickers
  }, [selectedTeam, filter, collection])

  const getTeamOwned = (teamCode) =>
    ALL_STICKERS.filter((s) => s.teamCode === teamCode && hasSticker(s.id)).length
  const getTeamTotal = (teamCode) =>
    ALL_STICKERS.filter((s) => s.teamCode === teamCode).length

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-3xl font-black text-white">{t.marketplace.title}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-slate-400 text-sm">
              <span className="text-white font-bold">{stats.owned}</span> / {ALL_STICKERS.length} {t.marketplace.stickersLabel}
            </span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-xs">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.owned / ALL_STICKERS.length) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Main tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
          {MAIN_TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setMainTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mainTab === key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mainTab === 'My Album' ? (
            <motion.div key="album" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Team tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scroll-smooth" style={{ scrollbarWidth: 'none' }}>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTeam('ALL')}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTeam === 'ALL'
                      ? 'bg-white/15 text-white border border-white/20'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                  }`}>
                  {t.marketplace.allTeams}
                </motion.button>
                {TEAMS.map((team) => (
                  <TeamTab
                    key={team.code}
                    team={team}
                    isActive={selectedTeam === team.code}
                    ownedCount={getTeamOwned(team.code)}
                    totalCount={getTeamTotal(team.code)}
                    onClick={() => setSelectedTeam(team.code)}
                  />
                ))}
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTeam('SPEC')}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedTeam === 'SPEC'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
                  }`}>
                  {t.marketplace.special}
                </motion.button>
              </div>

              {/* Filter chips */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {FILTER_KEYS.map((key) => (
                  <button key={key} onClick={() => setFilter(key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      filter === key
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                        : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-transparent'
                    }`}>
                    {t.marketplace.filters[key]}
                  </button>
                ))}
                <span className="ml-auto text-xs text-slate-600 self-center">
                  {displayedStickers.length} {t.marketplace.stickersLabel}
                </span>
              </div>

              {/* Sticker grid */}
              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t.marketplace.loadingCollection}
                </div>
              ) : (
                <motion.div layout="position" className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  <AnimatePresence>
                    {displayedStickers.map((sticker) => (
                      <StickerCard
                        key={sticker.id}
                        sticker={sticker}
                        hasIt={hasSticker(sticker.id)}
                        needsIt={needsSticker(sticker.id)}
                        onToggleHave={handleToggleHave}
                        onToggleNeed={toggleNeed}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TradeMatcher onOpenChat={setChatPartner} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TradeChat isOpen={Boolean(chatPartner)} onClose={() => setChatPartner(null)} partner={chatPartner} />
      <AchievementOverlay achievement={achievement} onDismiss={dismissAchievement} />
    </PageTransition>
  )
}
