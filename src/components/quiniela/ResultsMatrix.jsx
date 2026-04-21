import { useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { calculatePoints } from '../../lib/scoring'
import Flag from '../ui/Flag'

// ── Phase definitions ─────────────────────────────────────────────────────────
const PHASES = [
  { key: 'group_1', label: 'Jornada 1',      match: (s) => /group.*1/i.test(s)             },
  { key: 'group_2', label: 'Jornada 2',      match: (s) => /group.*2/i.test(s)             },
  { key: 'group_3', label: 'Jornada 3',      match: (s) => /group.*3/i.test(s)             },
  { key: 'r32',     label: 'Dieciseisavos',  match: (s) => /round of 32|r32/i.test(s)      },
  { key: 'r16',     label: 'Octavos',        match: (s) => /round of 16|r16/i.test(s)      },
  { key: 'qf',      label: 'Cuartos',        match: (s) => /quarter/i.test(s)              },
  { key: 'sf',      label: 'Semis',          match: (s) => /semi/i.test(s)                 },
  { key: 'final',   label: 'Final',          match: (s) => /^final$/i.test(s?.trim())      },
]

function getPhaseKey(stage) {
  return PHASES.find((p) => p.match(stage ?? ''))?.key ?? 'group_1'
}

// ── Cell color logic ──────────────────────────────────────────────────────────
function cellStyle(points, matchFinished) {
  if (!matchFinished) return 'bg-white/[0.03] border-white/5'
  if (points === 5) return 'bg-emerald-500/20 border-emerald-500/30'
  if (points >= 2)  return 'bg-amber-400/20  border-amber-400/30'
  return 'bg-slate-600/10 border-white/5'
}

// ── Winner flag from a prediction ────────────────────────────────────────────
function PredWinner({ pred, homeFlag, awayFlag }) {
  if (pred.home_score == null) return <span className="text-slate-600 text-xs">–</span>
  const diff = pred.home_score - pred.away_score
  if (diff > 0) return <Flag code={homeFlag} size="xs" />
  if (diff < 0) return <Flag code={awayFlag} size="xs" />
  return <span className="text-slate-400 text-xs font-bold">=</span>
}

// ── Match column header ───────────────────────────────────────────────────────
function MatchHeader({ match }) {
  const finished = match.status === 'finished'
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <div className="flex items-center gap-1">
        <Flag code={match.home_flag} size="xs" />
        <span className="text-[9px] text-slate-600 font-bold">VS</span>
        <Flag code={match.away_flag} size="xs" />
      </div>
      <div className="text-[10px] font-bold text-center leading-none">
        {finished
          ? <span className="text-white">{match.home_score}–{match.away_score}</span>
          : <span className="text-slate-600">?–?</span>
        }
      </div>
    </div>
  )
}

// ── Prediction cell ───────────────────────────────────────────────────────────
function PredCell({ match, prediction }) {
  const finished = match.status === 'finished'

  if (!prediction) {
    return (
      <td className="p-0 border border-white/5 min-w-[72px]">
        <div className="flex items-center justify-center h-[52px] text-slate-700 text-xs">
          ·
        </div>
      </td>
    )
  }

  const points = finished
    ? (prediction.points_earned ?? calculatePoints(prediction, match))
    : null

  return (
    <td className={`p-0 border min-w-[72px] transition-colors duration-300 ${cellStyle(points, finished)}`}>
      <div className="flex flex-col items-center justify-center gap-0.5 h-[52px] px-2">
        <PredWinner
          pred={prediction}
          homeFlag={match.home_flag}
          awayFlag={match.away_flag}
        />
        <span className="text-[10px] text-slate-300 font-bold leading-none whitespace-nowrap">
          {prediction.home_score}–{prediction.away_score}
        </span>
        {finished && points != null && (
          <span className={`text-[9px] font-black leading-none ${
            points === 5 ? 'text-emerald-400' :
            points >= 2  ? 'text-amber-400'   :
            'text-slate-600'
          }`}>
            +{points}
          </span>
        )}
      </div>
    </td>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ResultsMatrix({ members, predictions, fixtures }) {
  const shouldReduce = useReducedMotion()

  // Build available phases from actual fixture stages
  const availablePhases = useMemo(() => {
    const keys = new Set(fixtures.map((f) => getPhaseKey(f.stage)))
    return PHASES.filter((p) => keys.has(p.key))
  }, [fixtures])

  const [activePhase, setActivePhase] = useState(() => availablePhases[0]?.key ?? 'group_1')

  // Matches for active phase, sorted by start time
  const phaseMatches = useMemo(() => {
    const phase = PHASES.find((p) => p.key === activePhase)
    if (!phase) return []
    return fixtures
      .filter((f) => phase.match(f.stage ?? ''))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  }, [fixtures, activePhase])

  // Fast lookup: predMap[userId][matchId] → prediction
  const predMap = useMemo(() => {
    const map = {}
    for (const p of predictions) {
      if (!map[p.user_id]) map[p.user_id] = {}
      map[p.user_id][p.match_id] = p
    }
    return map
  }, [predictions])

  if (!members.length) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        Sin participantes aún.
      </div>
    )
  }

  return (
    <div>
      {/* Phase tabs — horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
        {availablePhases.map((phase) => (
          <button
            key={phase.key}
            onClick={() => setActivePhase(phase.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePhase === phase.key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'
            }`}
          >
            {phase.label}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: shouldReduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: shouldReduce ? 0 : -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {phaseMatches.length === 0 ? (
            <p className="text-center text-slate-600 text-sm py-8">
              Sin partidos en esta fase.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/8" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              <table className="border-collapse w-max">
                <thead>
                  <tr>
                    {/* Sticky participant header */}
                    <th
                      className="sticky left-0 z-20 bg-[#050B1A] border border-white/8 px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500 font-bold min-w-[130px] whitespace-nowrap"
                    >
                      Participante
                    </th>
                    {phaseMatches.map((match) => (
                      <th
                        key={match.id}
                        className="border border-white/8 bg-[#050B1A] px-2 py-3 text-center"
                      >
                        <MatchHeader match={match} />
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {members.map((member, rowIdx) => (
                    <tr key={member.id}>
                      {/* Sticky name cell */}
                      <td
                        className={`sticky left-0 z-10 bg-[#050B1A] border border-white/8 px-3 py-0 ${
                          rowIdx % 2 === 0 ? 'bg-[#050B1A]' : 'bg-white/[0.015]'
                        }`}
                      >
                        <div className="flex items-center gap-2 h-[52px]">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 flex items-center justify-center text-[10px] font-black text-amber-400 flex-shrink-0">
                            {(member.username ?? '?')[0].toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-white truncate max-w-[80px]">
                            {member.username ?? `User ${rowIdx + 1}`}
                          </span>
                        </div>
                      </td>

                      {phaseMatches.map((match) => (
                        <PredCell
                          key={match.id}
                          match={match}
                          prediction={predMap[member.id]?.[match.id] ?? null}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1 flex-wrap">
        <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">Leyenda:</span>
        {[
          { bg: 'bg-emerald-500/20 border-emerald-500/30', label: '5 pts — Exacto' },
          { bg: 'bg-amber-400/20 border-amber-400/30',     label: '2–3 pts — Parcial' },
          { bg: 'bg-slate-600/10 border-white/5',          label: '0 pts — Fallo' },
        ].map(({ bg, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm border ${bg}`} />
            <span className="text-[10px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
