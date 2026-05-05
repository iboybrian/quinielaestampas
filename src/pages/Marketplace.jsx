import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRightLeft, BookOpen, Loader2, ShoppingBag, MessageSquare, Search, X } from 'lucide-react'
import { TEAMS, ALL_STICKERS, SPECIAL_STICKERS } from '../lib/stickerData'
import { useMyCollection } from '../hooks/useStickers'
import { useTradeNotifications } from '../hooks/useTradeNotifications'
import { useAuthGate } from '../hooks/useAuthGate'
import { useLang } from '../contexts/LangContext'
import Flag from '../components/ui/Flag'
import AuthGateModal from '../components/ui/AuthGateModal'
import StickerCard from '../components/marketplace/StickerCard'
import TradeMatcher from '../components/marketplace/TradeMatcher'
import TradeChat from '../components/marketplace/TradeChat'
import DuplicateSearch from '../components/marketplace/DuplicateSearch'
import ChatInbox from '../components/marketplace/ChatInbox'
import AchievementOverlay, { useAchievements } from '../components/animations/AchievementOverlay'
import PageTransition from '../components/layout/PageTransition'

const FILTER_KEYS = ['All', 'Have', 'Missing']

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
      <div className="flex items-center gap-2">
        <Flag code={team.isoCode} size="sm" />
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

// Searchable combobox — filters teams by country name. Dropdown opens on focus.
function TeamSearch({ getTeamOwned, getTeamTotal, onSelect, placeholder, noResultsLabel }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimerRef = useRef(null)
  const inputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TEAMS
    return TEAMS.filter((tm) => tm.name.toLowerCase().includes(q))
  }, [query])

  const handleFocus = () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setOpen(true)
  }

  // Delay close so click on dropdown item registers before blur fires
  const handleBlur = () => {
    blurTimerRef.current = setTimeout(() => setOpen(false), 150)
  }

  const handleSelect = (code) => {
    onSelect(code)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  useEffect(() => () => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
  }, [])

  return (
    <div className="relative mb-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400/40 focus:bg-white/8 transition-colors"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-slate-900 border border-white/10 shadow-2xl max-h-72 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                {noResultsLabel}
              </div>
            ) : (
              filtered.map((tm) => {
                const owned = getTeamOwned(tm.code)
                const total = getTeamTotal(tm.code)
                const complete = owned === total
                return (
                  <button
                    key={tm.code}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(tm.code)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/8 transition-colors text-left"
                  >
                    <Flag code={tm.isoCode} size="sm" />
                    <span className="flex-1 text-sm text-white truncate">{tm.name}</span>
                    <span className={`text-xs font-mono font-bold flex-shrink-0 ${complete ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {owned}/{total}
                    </span>
                  </button>
                )
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Marketplace() {
  const { t } = useLang()
  const [mainTab, setMainTab] = useState('My Album')
  const [selectedTeam, setSelectedTeam] = useState('ALL')
  const [filter, setFilter] = useState('All')
  const [chatPartner, setChatPartner] = useState(null)
  const [chatContext, setChatContext] = useState(null)
  const { collection, loading, toggleHave, toggleNeed, hasSticker, needsSticker, duplicateCount, markDuplicate, removeDuplicate, stats } = useMyCollection()
  const { achievement, trigger: triggerAchievement, dismiss: dismissAchievement } = useAchievements()
  const { unreadTrades, tradePartners, totalUnread, markTradeRead } = useTradeNotifications()
  const { requireAuth, isAuthed, gateProps } = useAuthGate()

  // unreadByUserId for TradeMatcher dots
  const unreadByUserId = useMemo(() => {
    const map = {}
    Object.entries(unreadTrades).forEach(([tradeId, info]) => {
      const partner = tradePartners[tradeId]
      if (partner) map[partner.partnerId] = { tradeId, ...info }
    })
    return map
  }, [unreadTrades, tradePartners])

  // Handler: open chat with optional context (type, sticker) from any source
  const openChat = (partner, context = null) => {
    setChatPartner(partner)
    setChatContext(context ?? null)
  }

  const MAIN_TABS = [
    { key: 'My Album', label: t.marketplace.myAlbum, icon: BookOpen      },
    { key: 'Trade',    label: t.marketplace.trade,   icon: ArrowRightLeft },
    { key: 'Mercado',  label: t.marketplace.mercado, icon: ShoppingBag   },
    { key: 'Chats',    label: t.marketplace.chats,   icon: MessageSquare },
  ]

  const gateStickerAction = (fn) => (...args) => {
    if (!requireAuth(null, { message: t.authGate.messages.toggleSticker })) return
    return fn(...args)
  }
  const handleToggleNeed     = gateStickerAction(toggleNeed)
  const handleMarkDuplicate  = gateStickerAction(markDuplicate)
  const handleRemoveDuplicate = gateStickerAction(removeDuplicate)

  const handleToggleHave = async (stickerId) => {
    if (!requireAuth(null, { message: t.authGate.messages.toggleSticker })) return
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
          <img
            src="/assets/images/home/stickers.png"
            alt="Álbum"
            className="w-14 h-14 object-contain mb-3"
          />
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
              className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 relative ${
                mainTab === key ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-[10px] md:text-sm leading-tight text-center">{label}</span>
              {(key === 'Trade' || key === 'Chats') && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-black text-[9px] font-black flex items-center justify-center">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {mainTab === 'My Album' ? (
            <motion.div key="album" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {/* Searchable team combobox */}
              <TeamSearch
                getTeamOwned={getTeamOwned}
                getTeamTotal={getTeamTotal}
                onSelect={setSelectedTeam}
                placeholder={t.marketplace.searchTeam}
                noResultsLabel={t.marketplace.noResults}
              />

              {/* Team tabs (horizontal scroll) */}
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
                        duplicates={duplicateCount(sticker.id)}
                        onToggleHave={handleToggleHave}
                        onToggleNeed={handleToggleNeed}
                        onMarkDuplicate={handleMarkDuplicate}
                        onRemoveDuplicate={handleRemoveDuplicate}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          ) : mainTab === 'Trade' ? (
            <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TradeMatcher onOpenChat={openChat} unreadByUserId={unreadByUserId} />
            </motion.div>
          ) : mainTab === 'Mercado' ? (
            <motion.div key="mercado" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <DuplicateSearch onOpenChat={openChat} />
            </motion.div>
          ) : (
            <motion.div key="chats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChatInbox onOpenChat={openChat} unreadByTradeId={unreadTrades} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TradeChat
        isOpen={Boolean(chatPartner)}
        onClose={() => { setChatPartner(null); setChatContext(null) }}
        partner={chatPartner}
        context={chatContext}
        onTradeResolved={(tradeId) => markTradeRead(tradeId)}
      />
      <AchievementOverlay achievement={achievement} onDismiss={dismissAchievement} />

      <AuthGateModal {...gateProps} />
    </PageTransition>
  )
}
