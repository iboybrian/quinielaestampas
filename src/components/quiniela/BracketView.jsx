import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { MOCK_BRACKET } from '../../lib/footballApi'

function getWinner(match) {
  if (match.status !== 'finished') return null
  if (match.homeScore > match.awayScore) return 'home'
  if (match.awayScore > match.homeScore) return 'away'
  if (match.homePenalties != null && match.awayPenalties != null) {
    return match.homePenalties > match.awayPenalties ? 'home' : 'away'
  }
  return null
}

function BracketTeamRow({ team, isWinner, isLoser }) {
  return (
    <motion.div
      layout
      className={`flex items-center gap-2 px-3 py-2.5 transition-all duration-500 ${
        isLoser ? 'opacity-25 grayscale' : ''
      } ${isWinner ? 'bg-amber-500/10' : ''}`}
    >
      <span className="text-xl flex-shrink-0">{team.flag}</span>
      <span className={`text-sm font-semibold flex-1 truncate ${isWinner ? 'text-white' : 'text-slate-300'}`}>
        {team.team}
      </span>
      {isWinner && <span className="text-amber-400 text-xs flex-shrink-0">✓</span>}
    </motion.div>
  )
}

function BracketMatch({ match }) {
  const winner = getWinner(match)
  const isTBD = match.home.team === 'TBD' || match.away.team === 'TBD'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl overflow-hidden border transition-all min-w-[150px] ${
        isTBD ? 'border-white/5 opacity-50' :
        match.status === 'live' ? 'border-red-400/40 shadow-lg shadow-red-500/10' :
        match.status === 'finished' ? 'border-white/10' :
        'border-white/10'
      } bg-white/5`}
    >
      {match.status === 'live' && (
        <div className="bg-red-500 px-2 py-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase">Live</span>
        </div>
      )}

      <BracketTeamRow
        team={match.home}
        isWinner={winner === 'home'}
        isLoser={winner === 'away'}
      />
      <div className="h-px bg-white/5 mx-2" />
      <BracketTeamRow
        team={match.away}
        isWinner={winner === 'away'}
        isLoser={winner === 'home'}
      />

      {match.status === 'finished' && (
        <div className="bg-white/5 px-3 py-1 flex justify-between text-xs font-bold text-slate-400">
          <span>{match.homeScore}</span>
          <span className="text-slate-600">–</span>
          <span>{match.awayScore}</span>
        </div>
      )}

      {match.status === 'scheduled' && match.date && (
        <div className="px-3 py-1 text-[10px] text-slate-600 text-center">
          {format(new Date(match.date), 'MMM d')}
        </div>
      )}
    </motion.div>
  )
}

function BracketColumn({ title, matches, accentColor }) {
  return (
    <div className="flex flex-col min-w-[170px]">
      <div className={`text-center text-xs font-black uppercase tracking-widest mb-4 ${accentColor}`}>
        {title}
      </div>
      <div className="flex-1 flex flex-col justify-around gap-3">
        {matches.map((match) => (
          <BracketMatch key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}

export default function BracketView({ bracket = MOCK_BRACKET }) {
  const rounds = [
    { key: 'r16', title: 'Round of 16', color: 'text-slate-400' },
    { key: 'qf', title: 'Quarter-Finals', color: 'text-blue-400' },
    { key: 'sf', title: 'Semi-Finals', color: 'text-purple-400' },
    { key: 'final', title: 'Final', color: 'text-amber-400' },
  ]

  return (
    <div className="overflow-x-auto pb-6">
      <div className="flex gap-6 min-w-max px-2 pt-2 items-center" style={{ minHeight: '520px' }}>
        {rounds.map((round) => (
          <BracketColumn
            key={round.key}
            title={round.title}
            matches={bracket[round.key] ?? []}
            accentColor={round.color}
          />
        ))}

        {/* Connector */}
        <div className="text-slate-700 text-3xl self-center">→</div>

        {/* Champion */}
        <div className="flex flex-col items-center min-w-[130px]">
          <div className="text-center text-xs font-black uppercase tracking-widest mb-4 text-amber-400">Champion</div>
          <motion.div
            animate={{ boxShadow: bracket.champion ? '0 0 30px rgba(251,191,36,0.4)' : 'none' }}
            className={`w-full rounded-2xl border text-center p-5 ${
              bracket.champion
                ? 'bg-amber-400/10 border-amber-400/40'
                : 'bg-white/3 border-white/5 opacity-50'
            }`}
          >
            <div className="text-5xl mb-3">{bracket.champion ? '🏆' : '❓'}</div>
            <div className="font-black text-white text-sm">
              {bracket.champion ?? 'TBD'}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
