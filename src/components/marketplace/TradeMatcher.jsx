import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, ArrowRightLeft, MessageCircle, Loader2 } from 'lucide-react'
import { findTradeMatches } from '../../hooks/useStickers'
import { useAuth } from '../../contexts/AuthContext'
import { useCountryFilter } from '../../hooks/useCountryFilter'
import { ALL_STICKERS } from '../../lib/stickerData'
import { countryNameToCode } from '../../lib/countries'
import Flag from '../ui/Flag'

const MAX_STICKER_CHIPS = 3

function StickerChip({ stickerId, colorClass }) {
  const sticker = ALL_STICKERS.find((s) => s.id === stickerId)
  if (!sticker) return null
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${colorClass}`}>
      #{sticker.id.split('-').pop()} {sticker.name.split(' ')[0]}
    </span>
  )
}

function MatchScoreBar({ score, max = 10 }) {
  const pct = Math.min(100, (score / max) * 100)
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
      />
    </div>
  )
}

function TraderCard({ trader, onChat, unread }) {
  const letter = trader.username?.[0]?.toUpperCase() ?? '?'
  const hasUnread = unread && unread.count > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-4 flex flex-col gap-3 ${hasUnread ? 'border border-amber-400/30' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar + unread dot */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-black font-black text-lg">
            {letter}
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center">
              {unread.count > 9 ? '9+' : unread.count}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white truncate">{trader.username ?? 'Collector'}</span>
            {trader.country && countryNameToCode(trader.country) && (
              <Flag code={countryNameToCode(trader.country)} size="xs" />
            )}
          </div>
          {trader.country && (
            <div className="text-xs text-slate-400 mt-0.5">{trader.country}</div>
          )}
          {hasUnread && (
            <div className="text-xs text-amber-400 mt-0.5 truncate">💬 {unread.lastMsg}</div>
          )}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Match</span>
              <span className="text-xs text-emerald-400 font-bold">{trader.matchScore} stickers</span>
            </div>
            <MatchScoreBar score={trader.matchScore} />
          </div>
        </div>

        {/* Chat button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onChat(trader, { type: 'trade' })}
          className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
            hasUnread
              ? 'bg-amber-400/20 border-amber-400/40 text-amber-400 hover:bg-amber-400/30'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Sticker context rows */}
      {trader.theyHaveINeed?.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-slate-500 mr-0.5">Ellos tienen:</span>
          {trader.theyHaveINeed.slice(0, MAX_STICKER_CHIPS).map((id) => (
            <StickerChip key={id} stickerId={id} colorClass="bg-emerald-500/15 text-emerald-400" />
          ))}
          {trader.theyHaveINeed.length > MAX_STICKER_CHIPS && (
            <span className="text-[10px] text-slate-500">+{trader.theyHaveINeed.length - MAX_STICKER_CHIPS} más</span>
          )}
        </div>
      )}
      {trader.iHaveTheyNeed?.length > 0 && (
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] text-slate-500 mr-0.5">Yo les doy:</span>
          {trader.iHaveTheyNeed.slice(0, MAX_STICKER_CHIPS).map((id) => (
            <StickerChip key={id} stickerId={id} colorClass="bg-blue-500/15 text-blue-400" />
          ))}
          {trader.iHaveTheyNeed.length > MAX_STICKER_CHIPS && (
            <span className="text-[10px] text-slate-500">+{trader.iHaveTheyNeed.length - MAX_STICKER_CHIPS} más</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function TradeMatcher({ onOpenChat, unreadByUserId = {} }) {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const { onlyMyCountry, toggle, myCountry, apply } = useCountryFilter()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    findTradeMatches(user.id)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false))
  }, [user])

  const visibleMatches = useMemo(() => apply(matches), [matches, apply])

  if (!user) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Inicia sesión para encontrar socios de intercambio</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mr-3" />
        Buscando coincidencias…
      </div>
    )
  }

  if (!matches.length) {
    return (
      <div className="text-center py-16">
        <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 font-semibold mb-1">Sin coincidencias aún</p>
        <p className="text-slate-600 text-sm">Marca qué estampas tienes de más y cuáles buscas para encontrar socios.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
        <h3 className="font-bold text-white">Socios de Intercambio</h3>
        <span className="text-xs bg-emerald-400/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">{visibleMatches.length}</span>
        {myCountry && (
          <button
            type="button"
            onClick={toggle}
            className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              onlyMyCountry
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
            }`}
            title={onlyMyCountry ? 'Mostrar todos los países' : 'Solo mi país'}
          >
            {countryNameToCode(myCountry) && <Flag code={countryNameToCode(myCountry)} size="xs" />}
            <span>{onlyMyCountry ? 'Solo mi país' : 'Todos'}</span>
          </button>
        )}
      </div>
      {visibleMatches.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Sin socios en tu país. Desactiva el filtro para ver todos.
        </div>
      ) : (
        visibleMatches.map((trader) => (
          <TraderCard
            key={trader.id}
            trader={trader}
            onChat={onOpenChat}
            unread={unreadByUserId[trader.id]}
          />
        ))
      )}
    </div>
  )
}
