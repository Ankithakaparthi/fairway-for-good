/**
 * Draw Engine — Golf Charity Platform
 * Supports both random and algorithmic (score-frequency weighted) draw modes
 */

export interface DrawResult {
  drawnNumbers: number[]
  method: 'random' | 'algorithmic'
}

export interface EntryMatchResult {
  userId: string
  scores: number[]
  matchCount: number
  matchedNumbers: number[]
  tier: 'match5' | 'match4' | 'match3' | null
}

/**
 * Generate 5 random numbers in range 1-45 (Stableford range)
 */
export function randomDraw(): DrawResult {
  const numbers = new Set<number>()
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1)
  }
  return { drawnNumbers: Array.from(numbers).sort((a, b) => a - b), method: 'random' }
}

/**
 * Algorithmic draw: weights numbers by their frequency across all user scores
 * Most frequent scores have higher chance (heat-seeking draw)
 * Or optionally inverse-weighted (least frequent = harder to match)
 */
export function algorithmicDraw(
  allScores: number[][],
  mode: 'frequent' | 'infrequent' = 'frequent'
): DrawResult {
  // Build frequency map for 1-45
  const freq: Record<number, number> = {}
  for (let i = 1; i <= 45; i++) freq[i] = 0
  for (const userScores of allScores) {
    for (const score of userScores) {
      if (score >= 1 && score <= 45) freq[score]++
    }
  }

  // Build weighted pool
  const pool: number[] = []
  for (let n = 1; n <= 45; n++) {
    const weight = mode === 'frequent'
      ? (freq[n] + 1)           // +1 so every number has at least 1 chance
      : (46 - freq[n] + 1)      // invert so rarer = higher weight
    for (let w = 0; w < weight; w++) pool.push(n)
  }

  // Weighted random selection without replacement
  const selected = new Set<number>()
  const remaining = [...pool]
  while (selected.size < 5 && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length)
    selected.add(remaining[idx])
    // Remove all occurrences of the selected number
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i] === remaining[idx]) remaining.splice(i, 1)
    }
  }

  // Fallback: fill with random if pool was exhausted
  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1)
  }

  return {
    drawnNumbers: Array.from(selected).sort((a, b) => a - b),
    method: 'algorithmic',
  }
}

/**
 * Check how many of a user's scores match the drawn numbers
 */
export function checkEntry(userScores: number[], drawnNumbers: number[]): EntryMatchResult {
  const drawnSet = new Set(drawnNumbers)
  const matched = userScores.filter(s => drawnSet.has(s))
  const matchCount = matched.length

  let tier: 'match5' | 'match4' | 'match3' | null = null
  if (matchCount === 5) tier = 'match5'
  else if (matchCount === 4) tier = 'match4'
  else if (matchCount === 3) tier = 'match3'

  return {
    userId: '',
    scores: userScores,
    matchCount,
    matchedNumbers: matched,
    tier,
  }
}

/**
 * Calculate prize pool from subscriber count and plan mix
 */
export function calculatePrizePool(
  monthlySubscribers: number,
  yearlySubscribers: number,
  rollover: number = 0
): {
  total: number
  jackpot: number
  match4: number
  match3: number
} {
  // Monthly: £19.99, Yearly: £199.90/12 = ~£16.66/month
  const monthlyRevenue = monthlySubscribers * 19.99
  const yearlyRevenue = yearlySubscribers * (199.90 / 12)
  const totalRevenue = monthlyRevenue + yearlyRevenue

  // Prize pool is 50% of total revenue (remainder covers ops + charity)
  const prizePool = totalRevenue * 0.5

  return {
    total: parseFloat((prizePool + rollover).toFixed(2)),
    jackpot: parseFloat((prizePool * 0.40 + rollover).toFixed(2)),
    match4: parseFloat((prizePool * 0.35).toFixed(2)),
    match3: parseFloat((prizePool * 0.25).toFixed(2)),
  }
}

/**
 * Split prize equally among multiple winners in same tier
 */
export function splitPrize(poolAmount: number, winnerCount: number): number {
  if (winnerCount === 0) return 0
  return parseFloat((poolAmount / winnerCount).toFixed(2))
}

/**
 * Run a full draw simulation
 */
export function runDrawSimulation(
  entries: Array<{ userId: string; scores: number[] }>,
  drawnNumbers: number[],
  pools: { jackpot: number; match4: number; match3: number }
) {
  const results = entries.map(entry => {
    const match = checkEntry(entry.scores, drawnNumbers)
    return { ...match, userId: entry.userId }
  })

  const match5Winners = results.filter(r => r.tier === 'match5')
  const match4Winners = results.filter(r => r.tier === 'match4')
  const match3Winners = results.filter(r => r.tier === 'match3')

  return {
    drawnNumbers,
    results,
    winners: {
      match5: match5Winners.map(w => ({
        ...w,
        prize: splitPrize(pools.jackpot, match5Winners.length),
      })),
      match4: match4Winners.map(w => ({
        ...w,
        prize: splitPrize(pools.match4, match4Winners.length),
      })),
      match3: match3Winners.map(w => ({
        ...w,
        prize: splitPrize(pools.match3, match3Winners.length),
      })),
    },
    jackpotWon: match5Winners.length > 0,
    rolloverAmount: match5Winners.length === 0 ? pools.jackpot : 0,
  }
}
