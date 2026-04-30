export function bonusFromGames(
  perfectRounds: number,
  fastWins: number,
  perfectRoundBonus: number,
  fastWinBonus: number,
): number {
  return perfectRounds * perfectRoundBonus + fastWins * fastWinBonus;
}

export function gamesToWinFor(format: 'BO3' | 'BO5' | 'BO7'): number {
  if (format === 'BO3') return 2;
  if (format === 'BO5') return 3;
  return 4;
}

export function maxGamesFor(format: 'BO3' | 'BO5' | 'BO7'): number {
  if (format === 'BO3') return 3;
  if (format === 'BO5') return 5;
  return 7;
}
