import { Types } from 'mongoose';

export interface FixturePair {
  playerA: Types.ObjectId | string;
  playerB: Types.ObjectId | string;
  round: number;
}

/**
 * Round-robin fixture generation via the circle method.
 * If there's an odd number of players, a BYE marker is inserted; pairings vs BYE
 * are filtered out (those players get a rest round).
 */
export function generateRoundRobin<T extends string>(
  players: T[],
): { playerA: T; playerB: T; round: number }[] {
  const BYE = '__BYE__' as const;
  const list: (T | typeof BYE)[] = [...players];
  if (list.length % 2 === 1) list.push(BYE);

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;

  const fixed = list[0];
  let rotating = list.slice(1);

  const fixtures: { playerA: T; playerB: T; round: number }[] = [];

  for (let r = 0; r < rounds; r++) {
    const roundPairs: [T | typeof BYE, T | typeof BYE][] = [];
    roundPairs.push([fixed, rotating[rotating.length - 1]]);
    for (let i = 0; i < half - 1; i++) {
      roundPairs.push([rotating[i], rotating[rotating.length - 2 - i]]);
    }

    for (const [a, b] of roundPairs) {
      if (a === BYE || b === BYE) continue;
      fixtures.push({ playerA: a as T, playerB: b as T, round: r + 1 });
    }

    rotating = [
      rotating[rotating.length - 1],
      ...rotating.slice(0, rotating.length - 1),
    ];
  }

  return fixtures;
}
