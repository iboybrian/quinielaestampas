/**
 * Quiniela scoring rules:
 *  5 pts — exact scoreline
 *  3 pts — correct goal difference + winner
 *  2 pts — correct winner only (or draw both sides)
 *  0 pts — wrong
 */

export function calculatePoints(pred, actual) {
  if (
    pred.home_score == null ||
    pred.away_score == null ||
    actual.home_score == null ||
    actual.away_score == null
  ) {
    return 0
  }

  const pH = pred.home_score
  const pA = pred.away_score
  const aH = actual.home_score
  const aA = actual.away_score

  // Exact score
  if (pH === aH && pA === aA) return 5

  const predDiff = pH - pA
  const actualDiff = aH - aA

  // Correct goal difference and winner direction
  if (predDiff === actualDiff) return 3

  // Correct winner (or both drew)
  const predWinner = Math.sign(predDiff)
  const actualWinner = Math.sign(actualDiff)
  if (predWinner === actualWinner) return 2

  return 0
}

export function getPointLabel(points) {
  switch (points) {
    case 5: return { label: 'Exact!', color: 'text-amber-400', bg: 'bg-amber-400/20' }
    case 3: return { label: 'Diff ✓', color: 'text-blue-400', bg: 'bg-blue-400/20' }
    case 2: return { label: 'Winner', color: 'text-emerald-400', bg: 'bg-emerald-400/20' }
    default: return { label: 'Miss', color: 'text-slate-500', bg: 'bg-slate-500/10' }
  }
}

export function getTotalPoints(predictions) {
  return predictions.reduce((sum, p) => sum + (p.points_earned || 0), 0)
}

export function rankMembers(members) {
  return [...members].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    if (b.exact !== a.exact) return b.exact - a.exact
    return b.correct - a.correct
  })
}
