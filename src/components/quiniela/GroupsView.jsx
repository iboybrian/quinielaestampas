import { motion } from 'framer-motion'
import { WC2026_GROUPS } from '../../lib/footballApi'
import Flag from '../ui/Flag'

// Full class names required for Tailwind purge — no template literals for colour names
const ACCENTS = [
  { border: 'border-amber-400/20',   text: 'text-amber-400',   header: 'bg-amber-400/10'   },  // A
  { border: 'border-blue-400/20',    text: 'text-blue-400',    header: 'bg-blue-400/10'    },  // B
  { border: 'border-emerald-400/20', text: 'text-emerald-400', header: 'bg-emerald-400/10' },  // C
  { border: 'border-purple-400/20',  text: 'text-purple-400',  header: 'bg-purple-400/10'  },  // D
  { border: 'border-pink-400/20',    text: 'text-pink-400',    header: 'bg-pink-400/10'    },  // E
  { border: 'border-cyan-400/20',    text: 'text-cyan-400',    header: 'bg-cyan-400/10'    },  // F
  { border: 'border-orange-400/20',  text: 'text-orange-400',  header: 'bg-orange-400/10'  },  // G
  { border: 'border-red-400/20',     text: 'text-red-400',     header: 'bg-red-400/10'     },  // H
]

const TBD_CLASSES = {
  border: 'border-white/5',
  text: 'text-slate-600',
  header: 'bg-white/5',
}

function GroupCard({ group, index }) {
  const isTBD = !group.teams
  const accent = isTBD ? TBD_CLASSES : ACCENTS[index % 8]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.25, ease: 'easeOut' }}
      className={`glass rounded-2xl overflow-hidden border ${accent.border} ${isTBD ? 'opacity-40' : ''}`}
    >
      {/* Header */}
      <div className={`px-4 py-2.5 ${accent.header} border-b ${accent.border}`}>
        <span className={`text-xs font-black uppercase tracking-widest ${accent.text}`}>
          Group {group.letter}
        </span>
      </div>

      {/* Teams */}
      <div className="p-3 space-y-1.5">
        {isTBD ? (
          <p className="text-center py-5 text-slate-600 text-xs">2026 draw pending</p>
        ) : (
          group.teams.map((team) => (
            <div key={team.name} className="flex items-center gap-2.5 px-1 py-0.5">
              <Flag code={team.code} size="sm" />
              <span className="text-sm text-white font-medium truncate">{team.name}</span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default function GroupsView({ onMakePredictions, t }) {
  return (
    <div>
      {/* CTA — top */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onMakePredictions}
        className="w-full py-4 btn-primary rounded-2xl text-base font-black flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 mb-6"
      >
        ⚽ {t.quiniela.makePredictions}
      </motion.button>

      {/* Subtitle */}
      <p className="text-xs text-slate-500 text-center mb-5">
        WC 2022 groups (A–H) · Groups I–L set at 2026 draw
      </p>

      {/* 12-group grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {WC2026_GROUPS.map((group, i) => (
          <GroupCard key={group.letter} group={group} index={i} />
        ))}
      </div>
    </div>
  )
}
