import { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BracketView } from '../components/playoffs/BracketView';
import { CharacterAvatar } from '../components/player/CharacterAvatar';
import { Confetti } from '../components/ui/Confetti';
import type { IPlayer, IPlayoffMatch } from '../types';

// Mock players
const MOCK_PLAYERS: IPlayer[] = Array.from({ length: 30 }, (_, i) => ({
  _id: `player-${i}`,
  tournament: 'demo',
  name: `Player ${i + 1}`,
  gamerTag: `Player${i + 1}`,
  bio: `Gamer ${i + 1}`,
  character: ['Jin Kazama', 'Kazuya', 'Paul', 'Law', 'King', 'Yoshimitsu', 'Hwoarang', 'Ling'][i % 8],
  characterLocked: false,
  seed: i + 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}));

// Generate mock leaderboard data
const generateLeaderboard = () => {
  return MOCK_PLAYERS.map((p, idx) => ({
    rank: idx + 1,
    player: p,
    matchesPlayed: 29,
    wins: 29 - idx,
    losses: idx,
    bonusPoints: Math.max(0, 10 - Math.floor(idx / 3)),
    perfectRounds: Math.max(0, 15 - idx),
    fastWins: Math.max(0, 8 - Math.floor(idx / 4)),
    gamesWon: (29 - idx) * 2 + Math.floor(Math.random() * 2),
    gamesLost: idx * 2 + Math.floor(Math.random() * 2),
    gameDiff: (29 - idx) * 2 - idx * 2,
    winPercentage: Math.round(((29 - idx) / 29) * 100),
  }));
};

// Generate mock playoff bracket - Top 8 with Streak Mode
const generateBracket = (): IPlayoffMatch[] => {
  const bracket: IPlayoffMatch[] = [];
  let id = 1;

  // Quarterfinals (4 matches) - Top 8 seeding
  const qfPairings = [
    { a: 0, b: 7 }, // #1 vs #8
    { a: 4, b: 5 }, // #5 vs #4
    { a: 1, b: 6 }, // #2 vs #7
    { a: 2, b: 3 }, // #3 vs #6
  ];

  for (let i = 0; i < qfPairings.length; i++) {
    const { a, b } = qfPairings[i];
    bracket.push({
      _id: `match-${id}`,
      tournament: 'demo',
      round: 1,
      matchNumber: i + 1,
      playerA: MOCK_PLAYERS[a]._id,
      playerB: MOCK_PLAYERS[b]._id,
      seedA: a + 1,
      seedB: b + 1,
      mode: 'streak',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    id++;
  }

  // Semifinals (2 matches)
  const sfPairings = [
    { a: 0, b: 4 }, // QF1 winner vs QF2 winner
    { a: 1, b: 2 }, // QF3 winner vs QF4 winner
  ];

  for (let i = 0; i < sfPairings.length; i++) {
    bracket.push({
      _id: `match-${id}`,
      tournament: 'demo',
      round: 2,
      matchNumber: i + 1,
      playerA: undefined,
      playerB: undefined,
      mode: 'streak',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    id++;
  }

  // Finals (1 match)
  bracket.push({
    _id: `match-${id}`,
    tournament: 'demo',
    round: 3,
    matchNumber: 1,
    playerA: undefined,
    playerB: undefined,
    mode: 'streak',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return bracket;
};

interface PlayerObj extends IPlayer {
  _id: string;
}

interface MatchWithPlayers extends IPlayoffMatch {
  playerA?: PlayerObj | string;
  playerB?: PlayerObj | string;
}

export function DemoPublicView() {
  const [bracket, setBracket] = useState<MatchWithPlayers[]>(generateBracket());
  const leaderboard = useMemo(() => generateLeaderboard(), []);
  const championRef = useRef<HTMLDivElement>(null);

  const playerMap = new Map(MOCK_PLAYERS.map((p) => [p._id, p]));

  const finalMatch = bracket.find((m) => m.round === 3);
  const champion = finalMatch?.status === 'completed' && finalMatch?.streakResult?.winner
    ? playerMap.get(finalMatch.streakResult.winner)
    : null;

  useEffect(() => {
    if (champion && championRef.current) {
      setTimeout(() => {
        championRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [champion]);

  const handleMatchClick = (match: MatchWithPlayers) => {
    if (match.status === 'completed') return;

    const playerA = typeof match.playerA === 'string' ? playerMap.get(match.playerA) : match.playerA;
    const playerB = typeof match.playerB === 'string' ? playerMap.get(match.playerB) : match.playerB;

    if (!playerA || !playerB) return;

    // Determine winner randomly
    const winner = Math.random() > 0.5 ? playerA : playerB;
    const loser = winner._id === playerA._id ? playerB : playerA;

    // For streak mode, generate a realistic sequence
    const generateStreakSequence = () => {
      const sequence: string[] = [];
      let streakA = 0;
      let streakB = 0;

      while (streakA < 3 && streakB < 3) {
        const winnerStroke = Math.random() > 0.5;
        if (winner._id === playerA._id ? winnerStroke : !winnerStroke) {
          streakA++;
          streakB = 0;
          sequence.push(playerA._id);
        } else {
          streakB++;
          streakA = 0;
          sequence.push(playerB._id);
        }
      }

      return { sequence, finalStreakA: streakA, finalStreakB: streakB };
    };

    const { sequence, finalStreakA, finalStreakB } = generateStreakSequence();

    setBracket((prev) =>
      prev.map((m) => {
        if (m._id === match._id) {
          return {
            ...m,
            status: 'completed' as const,
            streakResult: {
              winner: winner._id,
              sequence,
              finalStreakA,
              finalStreakB,
              totalGames: sequence.length,
            },
          };
        }

        // Feed winner to next round
        if (m.round === match.round + 1) {
          if (match.matchNumber % 2 === 1 && m.matchNumber === Math.ceil(match.matchNumber / 2)) {
            return {
              ...m,
              playerA: winner._id,
            };
          } else if (
            match.matchNumber % 2 === 0 &&
            m.matchNumber === Math.ceil(match.matchNumber / 2)
          ) {
            return {
              ...m,
              playerB: winner._id,
            };
          }
        }

        return m;
      }),
    );
  };

  const bracketWithPlayers: MatchWithPlayers[] = bracket.map((m) => ({
    ...m,
    playerA: typeof m.playerA === 'string' ? playerMap.get(m.playerA) : m.playerA,
    playerB: typeof m.playerB === 'string' ? playerMap.get(m.playerB) : m.playerB,
  }));

  const completedMatches = bracket.filter((m) => m.status === 'completed').length;
  const totalMatches = bracket.length;

  return (
    <div className="w-full p-6 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-display tracking-widest uppercase text-text-muted text-xs">
            Tekken 8 · /tmtekken-demo
          </div>
          <h1 className="font-display text-5xl tracking-wider">
            <span className="bg-gradient-fire bg-clip-text text-transparent">TMtekken Demo</span>
          </h1>
          <p className="text-text-secondary mt-1">30 players, league complete, Top 8 Streak Mode bracket</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="purple">league</Badge>
          <Badge tone="red">Streak 3</Badge>
          <Badge tone="blue">{completedMatches}/{totalMatches} bracket matches</Badge>
          <Badge tone="gold">Top 8</Badge>
        </div>
      </header>

      {/* Leaderboard Section */}
      <section>
        <div className="flex flex-wrap items-center justify-between mb-3 gap-3">
          <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm flex items-center gap-2 flex-1">
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent max-w-[40px]" />
            Leaderboard
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </h2>
        </div>
        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-display">Rank</th>
                <th className="px-4 py-3 text-left font-display">Player</th>
                <th className="px-4 py-3 text-center font-display">W-L</th>
                <th className="px-4 py-3 text-center font-display">Win %</th>
                <th className="px-4 py-3 text-center font-display">Bonus</th>
                <th className="px-4 py-3 text-center font-display">Perfects</th>
                <th className="px-4 py-3 text-center font-display">Fast Wins</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 16).map((row) => (
                <tr
                  key={row.player._id}
                  className="border-b border-border/50 hover:bg-bg-secondary/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`font-display font-bold ${
                        row.rank === 1
                          ? 'text-accent-yellow'
                          : row.rank === 2
                            ? 'text-gray-400'
                            : row.rank === 3
                              ? 'text-orange-600'
                              : 'text-text-primary'
                      }`}
                    >
                      #{row.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-display tracking-wider">{row.player.gamerTag}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm">
                    {row.wins}-{row.losses}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm">{row.winPercentage}%</td>
                  <td className="px-4 py-3 text-center font-mono text-sm text-accent-yellow">
                    {row.bonusPoints}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-sm">{row.perfectRounds}</td>
                  <td className="px-4 py-3 text-center font-mono text-sm">{row.fastWins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="text-text-muted text-xs mt-2">Showing top 16 of 30 players</div>
      </section>

      {/* Playoffs Section */}
      <section>
        <div className="flex flex-wrap items-center justify-between mb-3 gap-3">
          <h2 className="font-display tracking-widest uppercase text-text-secondary text-sm flex items-center gap-2 flex-1">
            <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent max-w-[40px]" />
            Playoffs - Top 8 Streak 3
            <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </h2>
        </div>
        <Card className="p-4 sm:p-6">
          <div className="space-y-2 mb-4">
            <p className="text-text-secondary text-sm">
              Click any pending match to simulate a streak race. First player to 3 consecutive wins advances.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge tone="red">🔥 Streak 3 Mode</Badge>
              <Badge tone="gold">{champion ? '🏆 Champion Crowned!' : 'Click to Play Next Match'}</Badge>
            </div>
          </div>
          <div className="overflow-x-auto">
            <BracketView
              bracket={bracketWithPlayers}
              isAdmin={true}
              onMatchClick={handleMatchClick}
            />
          </div>

          {champion && (
            <div ref={championRef} className="mt-8 pt-8 border-t border-border">
              <div className="max-w-sm mx-auto text-center space-y-4">
                <div className="text-6xl animate-pulse">👑</div>
                <div className="text-sm font-display tracking-widest uppercase text-text-muted">
                  Tournament Champion
                </div>
                <div className="space-y-3 flex flex-col items-center">
                  <CharacterAvatar
                    name={champion.gamerTag}
                    character={champion.character}
                    size="xl"
                  />
                  <h3 className="font-display text-4xl tracking-wider text-accent-yellow">
                    {champion.gamerTag}
                  </h3>
                  <Badge tone="gold">{champion.character}</Badge>
                </div>
                <div className="pt-4 border-t border-border text-xs text-text-secondary">
                  <p>🔥 First to 3 wins in Streak Mode</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Match Stats */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="font-display text-3xl font-bold text-accent-yellow">
              {leaderboard.length}
            </div>
            <div className="text-text-secondary text-xs uppercase tracking-widest mt-1">
              Total Players
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-display text-3xl font-bold text-accent-green">
              {Math.round((29 * 30) / 2)}
            </div>
            <div className="text-text-secondary text-xs uppercase tracking-widest mt-1">
              League Matches
            </div>
          </Card>
          <Card className="p-4 text-center">
            <div className="font-display text-3xl font-bold text-accent-blue">
              {completedMatches}/{totalMatches}
            </div>
            <div className="text-text-secondary text-xs uppercase tracking-widest mt-1">
              Bracket Matches
            </div>
          </Card>
        </div>
      </section>

      <footer className="text-center text-text-muted text-xs pt-8 border-t border-border">
        <p>Demo Public View - Mock data for preview only</p>
      </footer>

      {champion && <Confetti />}
    </div>
  );
}
