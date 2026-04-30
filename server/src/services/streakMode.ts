export interface StreakEvalInput {
  sequence: string[];
  playerAId: string;
  playerBId: string;
  target: number;
  maxGameCap?: number;
}

export interface StreakEvalResult {
  winner: string | null;
  finalStreakA: number;
  finalStreakB: number;
  totalGames: number;
  capReached: boolean;
}

export function evaluateStreak(input: StreakEvalInput): StreakEvalResult {
  const { sequence, playerAId, playerBId, target, maxGameCap } = input;
  let streakA = 0;
  let streakB = 0;
  let winner: string | null = null;

  for (let i = 0; i < sequence.length; i++) {
    const w = sequence[i];
    if (w === playerAId) {
      streakA++;
      streakB = 0;
    } else if (w === playerBId) {
      streakB++;
      streakA = 0;
    }
    if (streakA >= target) {
      winner = playerAId;
      return {
        winner,
        finalStreakA: streakA,
        finalStreakB: streakB,
        totalGames: i + 1,
        capReached: false,
      };
    }
    if (streakB >= target) {
      winner = playerBId;
      return {
        winner,
        finalStreakA: streakA,
        finalStreakB: streakB,
        totalGames: i + 1,
        capReached: false,
      };
    }
  }

  const capReached = !!(maxGameCap && sequence.length >= maxGameCap);
  if (capReached) {
    const aWins = sequence.filter((w) => w === playerAId).length;
    const bWins = sequence.filter((w) => w === playerBId).length;
    if (aWins > bWins) winner = playerAId;
    else if (bWins > aWins) winner = playerBId;
  }

  return {
    winner,
    finalStreakA: streakA,
    finalStreakB: streakB,
    totalGames: sequence.length,
    capReached,
  };
}
