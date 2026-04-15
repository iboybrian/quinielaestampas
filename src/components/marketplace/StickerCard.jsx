import { motion } from 'framer-motion'
import { Star, Plus, Check } from 'lucide-react'
import { RARITY_STYLES } from '../../lib/stickerData'

export default function StickerCard({ sticker, hasIt, needsIt, onToggleHave, onToggleNeed, compact = false }) {
  const style = RARITY_STYLES[sticker.rarity] ?? RARITY_STYLES.common
  const isLegendary = sticker.rarity === 'legendary'
  const isRare = sticker.rarity === 'rare'

  return (
    <motion.div
      layout
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative rounded-2xl border overflow-hidden cursor-pointer select-none transition-all duration-200
        ${style.border} ${style.bg} ${style.glow}
        ${hasIt ? 'ring-2 ring-emerald-400/60' : ''}
        ${needsIt && !hasIt ? 'ring-2 ring-amber-400/60' : ''}
        ${!hasIt && !needsIt ? 'opacity-50' : ''}
      `}
    >
      {/* Legendary shimmer overlay */}
      {isLegendary && hasIt && (
        <div className="absolute inset-0 shimmer-gold pointer-events-none z-10 opacity-60" />
      )}

      {/* Rarity glow bg */}
      {(isLegendary || isRare) && (
        <div className={`absolute inset-0 ${isLegendary ? 'bg-amber-400/5' : 'bg-blue-400/5'} pointer-events-none`} />
      )}

      <div className={`relative z-20 ${compact ? 'p-2.5' : 'p-3'}`}>
        {/* Number badge */}
        <div className="flex items-start justify-between mb-2">
          <span className={`text-[10px] font-black ${style.labelColor} bg-black/20 px-1.5 py-0.5 rounded-md`}>
            #{sticker.id?.split('-').pop()}
          </span>
          {isLegendary && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Type icon */}
        <div className="text-2xl text-center mb-2">
          {sticker.type === 'badge' ? '🛡️' :
           sticker.type === 'squad' ? '👥' :
           sticker.type === 'special' ? (sticker.emoji ?? '⭐') :
           sticker.rarity === 'legendary' ? '⭐' :
           sticker.rarity === 'rare' ? '💫' : '📷'}
        </div>

        {/* Name */}
        <p className={`text-center font-semibold leading-tight ${compact ? 'text-[10px]' : 'text-xs'} text-slate-300 mb-3`}>
          {sticker.name}
        </p>

        {/* Action buttons */}
        <div className="flex gap-1">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => { e.stopPropagation(); onToggleHave(sticker.id) }}
            className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              hasIt
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-slate-500 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5'
            }`}
          >
            {hasIt ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {hasIt ? 'Have' : 'Have'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={(e) => { e.stopPropagation(); onToggleNeed(sticker.id) }}
            className={`flex-1 rounded-lg py-1 text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
              needsIt
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-slate-500 hover:bg-amber-500/10 hover:text-amber-400 border border-white/5'
            }`}
          >
            {needsIt ? '★' : '☆'}
            Need
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
