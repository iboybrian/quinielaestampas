/**
 * Quiniela scoring rules:
 *  5 pts — exact scoreline
 *  3 pts — correct goal difference + winner
 *  2 pts — correct winner only (or draw both sides)
 *  0 pts — wrong
 *
 * Extra points (when extraPointsEnabled = true and match has first_scorer set):
 *  +1 — correct first scoring team ('home'|'away'|'none')
 *  +1 — correct first goal half ('first'|'second')  [skipped when first_scorer = 'none']
 */

export function calculatePoints(pred, actual, extraPointsEnabled = false) {
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

  let pts
  if (pH === aH && pA === aA) {
    pts = 5
  } else {
    const predDiff   = pH - pA
    const actualDiff = aH - aA
    if (predDiff === actualDiff) pts = 3
    else if (Math.sign(predDiff) === Math.sign(actualDiff)) pts = 2
    else pts = 0
  }

  if (!extraPointsEnabled || actual.first_scorer == null) return pts

  let extra = 0
  if (pred.first_scorer != null && pred.first_scorer === actual.first_scorer) {
    extra += 1
  }
  if (
    actual.first_scorer !== 'none' &&
    actual.first_goal_half != null &&
    pred.first_goal_half != null &&
    pred.first_goal_half === actual.first_goal_half
  ) {
    extra += 1
  }

  return pts + extra
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
