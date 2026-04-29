import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, Users, MessageCircle, ChevronLeft } from 'lucide-react'
import { TEAMS, ALL_STICKERS } from '../../lib/stickerData'
import { findDuplicateOwners } from '../../hooks/useStickers'
import { useAuth } from '../../contexts/AuthContext'
import { useLang } from '../../contexts/LangContext'
import Flag from '../ui/Flag'

// ── Team selector ────────────────────────────────────────────────────────────

function TeamGrid({ onSelect }) {
  const { t } = useLang()
  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">{t.marketplace.selectTeam}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {TEAMS.map((team) => (
          <motion.button
            key={team.code}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(team)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all"
          >
            <Flag code={team.isoCode} size="md" />
            <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">{team.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Sticker picker ───────────────────────────────────────────────────────────

function StickerPicker({ team, onSelect, onBack }) {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const stickers = ALL_STICKERS.filter((s) => s.teamCode === team.code)

  const filtered = query.trim()
    ? stickers.filter((s) => {
        const q = query.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          String(s.number).includes(q) ||
          s.id.toLowerCase().includes(q)
        )
      })
    : stickers

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 text-sm mb-4 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
        {t.marketplace.backToStickers}
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Flag code={team.isoCode} size="sm" />
        <span className="font-bold text-white">{team.name}</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.marketplace.searchSticker}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-400/40 transition-colors"
        />
      </div>

      <p className="text-slate-500 text-xs mb-3">{t.marketplace.selectSticker}</p>
      <div className="space-y-1 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {filtered.map((sticker) => (
          <motion.button
            key={sticker.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(sticker)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-violet-400/20 transition-all text-left"
          >
            <span className="text-xs font-black text-slate-500 w-6 text-right flex-shrink-0">
              {sticker.number > 0 ? `#${sticker.number}` : '★'}
            </span>
            <span className="text-sm text-slate-200 flex-1 truncate">{sticker.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0 ${
              sticker.rarity === 'legendary' ? 'text-amber-400 bg-amber-400/10' :
              sticker.rarity === 'rare'      ? 'text-blue-400 bg-blue-400/10' :
                                               'text-slate-500 bg-white/5'
            }`}>
              {sticker.rarity}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Owner row ────────────────────────────────────────────────────────────────

function OwnerRow({ owner, onChat, contactLabel }) {
  const letter = owner.username?.[0]?.toUpperCase() ?? '?'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5"
    >
      {owner.avatar_url ? (
        <img src={owner.avatar_url} alt={owner.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black flex-shrink-0">
          {letter}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white truncate">{owner.username ?? 'Collector'}</div>
        {owner.country && <div className="text-xs text-slate-500">{owner.country}</div>}
        <div className="text-xs text-violet-400 font-bold mt-0.5">+{owner.extras} extra</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onChat(owner)}
        className="flex-shrink-0 w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center hover:bg-violet-500/30 transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
      </motion.button>
    </motion.div>
  )
}

// ── Owner list ───────────────────────────────────────────────────────────────

function OwnerList({ sticker, team, onBack, onChat }) {
  const { t } = useLang()
  const { user } = useAuth()
  const [owners, setOwners] = useState(null) // null = loading

  useEffect(() => {
    let cancelled = false
    findDuplicateOwners(sticker.id, user?.id)
      .then((data) => { if (!cancelled) setOwners(data) })
      .catch(() => { if (!cancelled) setOwners([]) })
    return () => { cancelled = true }
  }, [sticker.id, user?.id])

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 text-sm mb-4 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" />
        {t.marketplace.backToStickers}
      </button>

      <div className="flex items-center gap-2 mb-1">
        <Flag code={team.isoCode} size="sm" />
        <span className="text-sm text-slate-400">{sticker.name}</span>
        <span className="text-xs text-slate-600">#{sticker.id.split('-').pop()}</span>
      </div>
      <h3 className="font-bold text-white mb-4">{t.marketplace.ownersTitle}</h3>

      {owners === null ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          {t.marketplace.loadingOwners}
        </div>
      ) : owners.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-slate-400">{t.marketplace.noOwners}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {owners.map((owner) => (
            <OwnerRow
          key={owner.id}
          owner={owner}
          onChat={(o) => onChat(o, { type: 'mercado', sticker })}
          contactLabel={t.marketplace.contact}
        />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function DuplicateSearch({ onOpenChat }) {
  const { t } = useLang()
  const { user } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedSticker, setSelectedSticker] = useState(null)

  if (!user) {
    return (
      <div className="text-center py-16">
        <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="text-slate-400">{t.marketplace.signInMercado}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-white">{t.marketplace.mercadoTitle}</h2>
        <p className="text-slate-400 text-sm mt-1">{t.marketplace.mercadoSubtitle}</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedTeam && (
          <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <TeamGrid onSelect={setSelectedTeam} />
          </motion.div>
        )}

        {selectedTeam && !selectedSticker && (
          <motion.div key="stickers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <StickerPicker
              team={selectedTeam}
              onSelect={setSelectedSticker}
              onBack={() => setSelectedTeam(null)}
            />
          </motion.div>
        )}

        {selectedTeam && selectedSticker && (
          <motion.div key="owners" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <OwnerList
              sticker={selectedSticker}
              team={selectedTeam}
              onBack={() => setSelectedSticker(null)}
              onChat={onOpenChat}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
