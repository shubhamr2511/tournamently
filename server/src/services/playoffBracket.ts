export interface SeededPlayer {
  playerId: string;
  seed: number;
}

export interface BracketMatch {
  round: number;
  matchNumber: number;
  seedA?: number;
  seedB?: number;
  playerA?: string;
  playerB?: string;
  feederMatchAIndex?: number;
  feederMatchBIndex?: number;
}

/**
 * Build a single-elimination bracket from seeded players. Uses standard
 * tournament seeding (1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6) for size-8 brackets,
 * and (1 vs 4, 2 vs 3) for size-4. For arbitrary sizes that are powers of 2,
 * uses the standard seed pattern; non-power-of-two sizes are not supported here
 * (validated at caller).
 */
export function buildBracket(seeded: SeededPlayer[]): BracketMatch[] {
  const size = seeded.length;
  if (size < 2) return [];

  const sortedBySeed = [...seeded].sort((a, b) => a.seed - b.seed);
  const seedOrder = standardSeedOrder(size);

  const round1: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const seedA = seedOrder[i * 2];
    const seedB = seedOrder[i * 2 + 1];
    const a = sortedBySeed[seedA - 1];
    const b = sortedBySeed[seedB - 1];
    round1.push({
      round: 1,
      matchNumber: i + 1,
      seedA,
      seedB,
      playerA: a?.playerId,
      playerB: b?.playerId,
    });
  }

  const matches: BracketMatch[] = [...round1];
  let prevRoundCount = round1.length;
  let prevRoundStart = 0;
  let round = 2;
  while (prevRoundCount > 1) {
    const newCount = prevRoundCount / 2;
    for (let i = 0; i < newCount; i++) {
      matches.push({
        round,
        matchNumber: i + 1,
        feederMatchAIndex: prevRoundStart + i * 2,
        feederMatchBIndex: prevRoundStart + i * 2 + 1,
      });
    }
    prevRoundStart += prevRoundCount;
    prevRoundCount = newCount;
    round++;
  }
  return matches;
}

/**
 * Standard tournament seed order, e.g. for size 8:
 * [1, 8, 4, 5, 2, 7, 3, 6]
 */
export function standardSeedOrder(size: number): number[] {
  if ((size & (size - 1)) !== 0) {
    throw new Error(`Bracket size must be a power of 2; got ${size}`);
  }
  let order = [1, 2];
  while (order.length < size) {
    const next: number[] = [];
    const nextSize = order.length * 2;
    for (const seed of order) {
      next.push(seed);
      next.push(nextSize + 1 - seed);
    }
    order = next;
  }
  return order;
}
