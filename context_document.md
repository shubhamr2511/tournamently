# TournaMently — Claude Code Context Document

> **Purpose**: This document is the single source of truth for building TournaMently. Hand this to Claude Code and it has everything needed to build, debug, and extend the app.

---

## 1. WHAT IS TOURNAMENTLY

TournaMently is a tournament management web app for office and friend group competitions. It is **not** a bracket generator — it's a tournament OS with league stages, bonus point systems, dramatic playoff formats, and a fighting-game-inspired UI.

**First tournament**: "TMtekken" — a Tekken fighting game tournament with 22–24 players in round-robin format.

**Public URL pattern**: `tournamently.in/[slug]` → e.g. `tournamently.in/TMtekken`

---

## 2. ARCHITECTURE OVERVIEW

```
tournamently/
├── client/                  # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Primitives: Button, Card, Modal, Badge, Input, Select, Toggle
│   │   │   ├── layout/      # AppShell, Sidebar, TopBar, PublicLayout
│   │   │   ├── player/      # PlayerCard, PlayerForm, PlayerGrid, CharacterPicker
│   │   │   ├── match/       # MatchCard, MatchResultForm, MatchList, MatchFilters
│   │   │   ├── leaderboard/ # LeaderboardTable, LeaderboardRow, RankBadge
│   │   │   ├── playoffs/    # BracketView, StreakTracker, PlayoffMatchCard
│   │   │   └── tournament/  # TournamentCard, CreateTournamentForm, DashboardStats
│   │   ├── pages/           # Route-level page components
│   │   │   ├── Landing.tsx
│   │   │   ├── CreateTournament.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Players.tsx
│   │   │   ├── Fixtures.tsx
│   │   │   ├── MatchResult.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   ├── MatchCenter.tsx
│   │   │   ├── PlayerProfile.tsx
│   │   │   ├── Playoffs.tsx
│   │   │   └── PublicView.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useTournament.ts
│   │   │   ├── useLeaderboard.ts
│   │   │   ├── useMatches.ts
│   │   │   └── useAuth.ts
│   │   ├── services/        # API client layer (axios/fetch wrappers)
│   │   │   └── api.ts
│   │   ├── types/           # Shared TypeScript types/interfaces
│   │   │   └── index.ts
│   │   ├── utils/           # Pure utility functions
│   │   │   ├── scoring.ts
│   │   │   └── formatting.ts
│   │   ├── context/         # React context providers
│   │   │   └── AuthContext.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css        # Tailwind directives + custom CSS vars
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                  # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── models/          # Mongoose schemas
│   │   │   ├── Tournament.ts
│   │   │   ├── Player.ts
│   │   │   ├── Match.ts
│   │   │   └── PlayoffMatch.ts
│   │   ├── routes/          # Express route handlers
│   │   │   ├── tournament.ts
│   │   │   ├── player.ts
│   │   │   ├── match.ts
│   │   │   ├── leaderboard.ts
│   │   │   ├── playoff.ts
│   │   │   ├── fixture.ts
│   │   │   ├── public.ts
│   │   │   └── auth.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts       # Admin password middleware
│   │   │   └── errorHandler.ts
│   │   ├── services/        # Business logic (pure functions where possible)
│   │   │   ├── fixtureGenerator.ts
│   │   │   ├── scheduler.ts
│   │   │   ├── leaderboardCalculator.ts
│   │   │   ├── tiebreaker.ts
│   │   │   ├── playoffBracket.ts
│   │   │   └── streakMode.ts
│   │   ├── utils/
│   │   │   └── validation.ts
│   │   ├── seed/
│   │   │   └── tmtekken.ts   # Demo seed data
│   │   ├── config/
│   │   │   └── index.ts      # Env vars, DB URI, port
│   │   └── index.ts          # Express app entry
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                  # Shared types used by both client and server
│   └── types.ts
│
├── .env.example
├── package.json             # Root workspace scripts
├── README.md
└── docker-compose.yml       # MongoDB + optional app containers
```

---

## 3. DATA MODELS (Mongoose Schemas)

### 3.1 Tournament

```typescript
interface ITournament {
  _id: ObjectId;
  name: string;                    // "TMtekken"
  slug: string;                    // "TMtekken" — URL-safe, unique
  game: string;                    // "Tekken 8"
  description?: string;
  format: 'round_robin';          // Future: 'swiss', 'double_elim'
  playerCount: number;             // 22–24 (configurable, min 2)
  matchFormat: 'BO3' | 'BO5' | 'BO7'; // Best-of for league matches
  startDate: Date;
  endDate: Date;
  matchesPerDay: number;           // e.g. 6
  weekdaysOnly: boolean;           // Skip Sat/Sun
  status: 'draft' | 'registration' | 'league' | 'playoffs' | 'completed';
  adminPassword: string;           // Hashed (bcrypt)

  // Scoring settings
  scoring: {
    perfectRoundBonus: number;     // Default: 1
    fastWinBonus: number;          // Default: 1
    fastWinThresholdSeconds: number; // Default: 10
  };

  // Ranking settings
  ranking: {
    primary: 'wins';              // Always wins first
    tiebreakers: ('bonus_points' | 'head_to_head' | 'game_diff' | 'perfects' | 'fast_wins')[];
    // Default order: ['bonus_points', 'head_to_head', 'game_diff', 'perfects', 'fast_wins']
  };

  // Character system
  characterLock: boolean;          // If true, can't change after selection
  availableCharacters: string[];   // Seeded Tekken character list

  // Playoff settings (set when playoffs created)
  playoff?: {
    format: 'normal' | 'streak';
    size: 4 | 8 | number;         // Custom sizes allowed
    matchFormat: 'BO3' | 'BO5' | 'BO7';
    streakTarget?: number;         // Default: 3 (for streak mode)
    maxGameCap?: number;           // Optional cap for streak mode (e.g. 15)
  };

  fixturesGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Player

```typescript
interface IPlayer {
  _id: ObjectId;
  tournament: ObjectId;           // ref: Tournament
  name: string;                   // Real name
  gamerTag: string;               // Display name / tag
  bio?: string;
  avatarUrl?: string;             // URL to avatar image
  department?: string;            // e.g. "Engineering", "Product"
  character?: string;             // Selected Tekken character
  characterLocked: boolean;       // Set to true once locked
  seed?: number;                  // For playoff seeding
  isActive: boolean;              // Soft delete
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3 Match (League)

```typescript
interface IMatch {
  _id: ObjectId;
  tournament: ObjectId;
  matchNumber: number;             // Sequential match # (1, 2, 3...)
  playerA: ObjectId;               // ref: Player
  playerB: ObjectId;               // ref: Player
  scheduledDate?: Date;            // Assigned by scheduler, editable by admin
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  // Result (filled after match played)
  result?: {
    winner: ObjectId;              // ref: Player
    loser: ObjectId;               // ref: Player
    score: '2-0' | '2-1';         // BO3 scores
    games: IGameResult[];          // Individual game results (2 or 3 games)

    // Bonus tracking — per player
    playerAStats: {
      perfectRounds: number;       // How many perfect rounds player A achieved
      fastWins: number;            // How many sub-10s wins player A achieved
      bonusPoints: number;         // Computed: perfectRounds * bonus + fastWins * bonus
    };
    playerBStats: {
      perfectRounds: number;
      fastWins: number;
      bonusPoints: number;
    };

    notes?: string;
    isFeatured: boolean;           // Admin can mark notable matches
    isUpset: boolean;              // Admin can flag upsets
    completedAt: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

interface IGameResult {
  gameNumber: number;              // 1, 2, or 3
  winner: ObjectId;                // ref: Player
  // Optional: per-game detail tracking
  perfectRound?: boolean;
  fastWin?: boolean;
}
```

### 3.4 PlayoffMatch

```typescript
interface IPlayoffMatch {
  _id: ObjectId;
  tournament: ObjectId;
  round: number;                   // 1 = quarters, 2 = semis, 3 = finals (or 1 = semis if top 4)
  matchNumber: number;             // Position in bracket
  playerA?: ObjectId;              // null if TBD (waiting for feeder match)
  playerB?: ObjectId;
  seedA?: number;
  seedB?: number;
  feederMatchA?: ObjectId;         // ref: PlayoffMatch — winner feeds in
  feederMatchB?: ObjectId;

  mode: 'normal' | 'streak';

  // Normal mode result
  normalResult?: {
    winner: ObjectId;
    score: string;                 // "3-1" for BO5, etc.
    games: IGameResult[];
  };

  // Streak mode result
  streakResult?: {
    winner: ObjectId;
    sequence: ObjectId[];          // Array of winner IDs per game, in order
    // e.g. [playerA, playerA, playerB, playerA, playerA, playerA]
    // playerA wins: had streak of 3 at the end
    finalStreakA: number;
    finalStreakB: number;
    totalGames: number;
  };

  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.5 LeaderboardRow (Computed, not stored — or cached)

```typescript
interface ILeaderboardRow {
  rank: number;
  player: IPlayer;
  matchesPlayed: number;
  wins: number;
  losses: number;
  bonusPoints: number;
  perfectRounds: number;
  fastWins: number;
  gamesWon: number;
  gamesLost: number;
  gameDiff: number;                // gamesWon - gamesLost
  winPercentage: number;           // wins / matchesPlayed * 100
  // Used for tiebreaking, not displayed
  headToHeadRecord?: Record<string, 'win' | 'loss'>;
}
```

---

## 4. API ROUTES

All admin routes require `Authorization: Bearer <token>` header. Token obtained via POST `/api/auth/login`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with tournament slug + admin password → JWT token |
| GET | `/api/auth/verify` | Verify token validity |

### Tournaments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tournaments` | List all tournaments |
| POST | `/api/tournaments` | Create tournament (admin sets password here) |
| GET | `/api/tournaments/:id` | Get tournament by ID |
| PUT | `/api/tournaments/:id` | Update tournament settings 🔒 |
| DELETE | `/api/tournaments/:id` | Delete tournament 🔒 |
| GET | `/api/tournaments/slug/:slug` | Get tournament by slug (public) |

### Players
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tournaments/:tid/players` | List players |
| POST | `/api/tournaments/:tid/players` | Add player 🔒 (blocked if fixtures generated) |
| PUT | `/api/tournaments/:tid/players/:pid` | Edit player 🔒 (name/bio/avatar always; character only if not locked) |
| DELETE | `/api/tournaments/:tid/players/:pid` | Remove player 🔒 (blocked if fixtures generated) |

### Fixtures
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tournaments/:tid/fixtures/generate` | Generate round-robin fixtures + schedule 🔒 |
| GET | `/api/tournaments/:tid/fixtures` | Get all fixtures (with filters: date, status, player) |
| PUT | `/api/tournaments/:tid/fixtures/:mid/reschedule` | Change match date 🔒 |
| DELETE | `/api/tournaments/:tid/fixtures/reset` | Delete all fixtures (allows player edits again) 🔒 |
| GET | `/api/tournaments/:tid/fixtures/today` | Today's matches |
| GET | `/api/tournaments/:tid/fixtures/upcoming` | Next 7 days of matches |
| GET | `/api/tournaments/:tid/fixtures/overdue` | Past-date matches still pending |

### Match Results
| Method | Path | Description |
|--------|------|-------------|
| PUT | `/api/tournaments/:tid/matches/:mid/result` | Submit match result 🔒 |
| PUT | `/api/tournaments/:tid/matches/:mid/result/edit` | Edit existing result 🔒 |
| DELETE | `/api/tournaments/:tid/matches/:mid/result` | Clear result 🔒 |

### Leaderboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tournaments/:tid/leaderboard` | Computed leaderboard with full tiebreaking |

### Playoffs
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tournaments/:tid/playoffs/create` | Create playoff bracket 🔒 |
| GET | `/api/tournaments/:tid/playoffs` | Get bracket + matches |
| PUT | `/api/tournaments/:tid/playoffs/:mid/result` | Submit playoff match result 🔒 |
| PUT | `/api/tournaments/:tid/playoffs/:mid/streak-game` | Add one game to streak sequence 🔒 |

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/public/:slug` | Full public tournament data (leaderboard, fixtures, recent, featured, playoffs) |

---

## 5. CORE BUSINESS LOGIC

### 5.1 Round-Robin Fixture Generation

```
Total matches = n * (n - 1) / 2

Algorithm: Circle method
- Fix player 1
- Rotate remaining players
- Generates (n-1) rounds of (n/2) matches each
- If odd number of players, add a BYE; players matched vs BYE get a rest round
```

### 5.2 Scheduling Algorithm

```
Input: fixtures[], startDate, endDate, matchesPerDay, weekdaysOnly
Output: each fixture gets a scheduledDate

1. Generate list of available dates between start and end
2. If weekdaysOnly, filter out Saturday (6) and Sunday (0)
3. Calculate total slots = availableDates.length * matchesPerDay
4. If totalMatches > totalSlots → return validation error with message
5. Distribute fixtures sequentially across dates, filling each date up to matchesPerDay
6. Additional constraint: try to space out each player's matches (no player plays more than 2 matches per day ideally — soft constraint, warn if unavoidable)
```

### 5.3 Leaderboard Calculation

```
For each player:
  1. Aggregate all completed matches where player is playerA or playerB
  2. Count wins, losses
  3. Sum bonusPoints from playerAStats/playerBStats as appropriate
  4. Sum perfectRounds, fastWins
  5. Count gamesWon, gamesLost from game results
  6. Compute gameDiff = gamesWon - gamesLost
  7. Compute winPercentage

Sort by (in order):
  1. wins DESC
  2. bonusPoints DESC
  3. head-to-head (only if exactly 2 players tied — check direct match result)
  4. gameDiff DESC
  5. perfectRounds DESC
  6. fastWins DESC

Assign ranks (handle ties: same rank for identical records)
```

### 5.4 Head-to-Head Tiebreaker Detail

```
Only applies when EXACTLY 2 players are tied on wins + bonus.
Look up the direct match between them:
  - If completed, whoever won that match ranks higher
  - If not yet played, skip to next tiebreaker
If 3+ players are tied, skip head-to-head entirely and use game diff.
```

### 5.5 Streak Mode Logic

```
Streak of 3 (configurable target):
- Games are played continuously
- Track current streak for each player
- When a player wins: increment their streak, reset opponent's streak to 0
- When a player's streak reaches target (3): they win the match
- Store full sequence as array of winner IDs

Example sequence: [A, A, B, B, A, A, A]
  - A wins game 1: streakA=1, streakB=0
  - A wins game 2: streakA=2, streakB=0
  - B wins game 3: streakA=0, streakB=1
  - B wins game 4: streakA=0, streakB=2
  - A wins game 5: streakA=1, streakB=0
  - A wins game 6: streakA=2, streakB=0
  - A wins game 7: streakA=3 → A WINS

Optional maxGameCap: if total games reaches cap with no winner, player with more total game wins in the sequence wins. If still tied, sudden death (next game wins).
```

### 5.6 Playoff Bracket Creation

```
Input: size (4 or 8), players from leaderboard top N

For Top 8 bracket:
  QF1: Seed 1 vs Seed 8
  QF2: Seed 4 vs Seed 5
  QF3: Seed 2 vs Seed 7
  QF4: Seed 3 vs Seed 6

  SF1: Winner QF1 vs Winner QF2
  SF2: Winner QF3 vs Winner QF4

  Final: Winner SF1 vs Winner SF2

For Top 4:
  SF1: Seed 1 vs Seed 4
  SF2: Seed 2 vs Seed 3
  Final: Winner SF1 vs Winner SF2

Custom: Admin selects specific players and assigns seeds manually.
```

---

## 6. VALIDATION RULES

| Rule | Where | Detail |
|------|-------|--------|
| Slug format | Create tournament | Must match `/^[a-zA-Z0-9_-]+$/`, 3–30 chars, unique |
| Min players | Generate fixtures | At least 2 players |
| No player edits after fixtures | Add/delete player | Blocked unless fixtures reset |
| Character lock | Edit player character | If tournament.characterLock && player.characterLocked → reject |
| Score consistency | Submit result | If score is "2-0", games array must have exactly 2 entries with same winner. If "2-1", exactly 3 entries, winner won 2. |
| Bonus point validation | Submit result | perfectRounds >= 0, fastWins >= 0 |
| Schedule validation | Generate fixtures | totalMatches <= availableDays * matchesPerDay |
| Duplicate match | Generate fixtures | No duplicate playerA+playerB pairs |
| Self-match | Generate fixtures | playerA !== playerB |
| Playoff size | Create bracket | Must be power of 2 (2, 4, 8, 16) or custom |
| Streak target | Streak mode | Must be >= 2, default 3 |

---

## 7. TEKKEN CHARACTER SEED DATA

```typescript
const TEKKEN_CHARACTERS = [
  "Jin Kazama", "Kazuya Mishima", "Paul Phoenix", "Law",
  "King", "Yoshimitsu", "Hwoarang", "Ling Xiaoyu",
  "Bryan Fury", "Nina Williams", "Lei Wulong", "Steve Fox",
  "Asuka Kazama", "Devil Jin", "Dragunov", "Leo",
  "Lars Alexandersson", "Alisa Bosconovitch", "Claudio",
  "Shaheen", "Katarina", "Lucky Chloe", "Jack-8",
  "Raven", "Feng Wei", "Lili", "Julia Chang",
  "Leroy Smith", "Fahkumram", "Kunimitsu", "Lidia",
  "Azucena", "Victor Chevalier", "Reina"
];
```

Use placeholder colored silhouettes or initials for character avatars — no copyrighted images.

---

## 8. SEED TOURNAMENT DATA

Create on first run (or via `npm run seed`):

```typescript
const SEED_TOURNAMENT = {
  name: "TMtekken",
  slug: "TMtekken",
  game: "Tekken 8",
  description: "The ultimate office Tekken showdown",
  format: "round_robin",
  playerCount: 8,
  matchFormat: "BO3",
  startDate: "2025-06-01",
  endDate: "2025-07-15",
  matchesPerDay: 4,
  weekdaysOnly: true,
  adminPassword: "admin123", // Hashed before storage
  scoring: { perfectRoundBonus: 1, fastWinBonus: 1, fastWinThresholdSeconds: 10 },
  ranking: { primary: "wins", tiebreakers: ["bonus_points", "head_to_head", "game_diff", "perfects", "fast_wins"] },
  characterLock: false,
  availableCharacters: TEKKEN_CHARACTERS,
};

const SEED_PLAYERS = [
  { name: "Snehil", gamerTag: "Snehil", department: "Founder", character: "Jin Kazama" },
  { name: "Rushi", gamerTag: "Rushi", department: "Engineering", character: "Kazuya Mishima" },
  { name: "Product Ninja", gamerTag: "ProductNinja", department: "Product", character: "Yoshimitsu" },
  { name: "Tech Warrior", gamerTag: "TechWarrior", department: "Engineering", character: "Bryan Fury" },
  { name: "Marketing Monk", gamerTag: "MarketingMonk", department: "Marketing", character: "Lei Wulong" },
  { name: "Design Samurai", gamerTag: "DesignSamurai", department: "Design", character: "Hwoarang" },
  { name: "Data Demon", gamerTag: "DataDemon", department: "Data", character: "Devil Jin" },
  { name: "HR Hustler", gamerTag: "HRHustler", department: "HR", character: "King" },
];
```

---

## 9. AUTH SYSTEM

Simple password-based auth per tournament:

1. Admin sets password when creating tournament
2. Password is bcrypt hashed and stored on tournament doc
3. Login: POST `/api/auth/login` with `{ slug, password }` → returns JWT containing `{ tournamentId, role: 'admin' }`
4. JWT expires in 24 hours
5. All 🔒 routes check JWT via middleware
6. Public routes (`/api/public/:slug`) require no auth

**No user accounts, no registration.** Just one admin password per tournament.

---

## 10. UI / DESIGN SYSTEM

### Theme: "Fight Night"

A dark, cinematic fighting-game aesthetic. Not a spreadsheet. Not generic dashboard.

**Color Palette (CSS Variables):**
```css
:root {
  --bg-primary: #0a0a0f;          /* Near-black with blue tint */
  --bg-secondary: #12121a;        /* Card backgrounds */
  --bg-tertiary: #1a1a2e;         /* Elevated surfaces */
  --bg-hover: #22223a;

  --text-primary: #f0f0f5;
  --text-secondary: #8888aa;
  --text-muted: #555577;

  --accent-yellow: #FFD700;        /* Electric gold — primary accent */
  --accent-red: #FF2D55;           /* Hot red — danger, upsets, streaks */
  --accent-blue: #00D4FF;          /* Cyan — info, links */
  --accent-green: #00FF88;         /* Win indicator */
  --accent-purple: #A855F7;        /* Playoff / special */

  --border: #2a2a3e;
  --border-glow: rgba(255, 215, 0, 0.3);

  --gradient-fire: linear-gradient(135deg, #FF2D55, #FF8C00);
  --gradient-gold: linear-gradient(135deg, #FFD700, #FFA500);
  --gradient-dark: linear-gradient(180deg, #0a0a0f, #12121a);
}
```

**Typography:**
- Headlines: `"Rajdhani", "Oswald", sans-serif` — bold, condensed, fighting-game feel
- Body: `"Exo 2", "Barlow", sans-serif` — clean, techy
- Monospace stats: `"JetBrains Mono", "Fira Code", monospace`
- Load from Google Fonts

**Design Elements:**
- Angled clip-paths on cards (like character select screens)
- Subtle scan-line or noise texture overlay on backgrounds
- Glow effects on hover (box-shadow with accent colors)
- Rank badges with metallic gradients (#1 gold, #2 silver, #3 bronze)
- Fire/streak icons (🔥) for streak mode, not emoji — use SVG flame
- Status badges: completed = green, scheduled = blue, overdue = red, cancelled = gray
- Match cards feel like fight announcements ("VS" between players)
- Leaderboard rows have subtle left-border color based on rank zone (gold for top 4, cyan for top 8)
- Page transitions: fade + slight slide up
- Loading states: pulsing skeleton with theme colors

**Responsive Breakpoints:**
- Mobile: < 640px (single column, stacked cards)
- Tablet: 640–1024px
- Desktop: > 1024px
- TV mode (public view): optimize for 1920×1080 with large fonts

### Component Patterns

**PlayerCard:**
- Dark card with angled bottom edge
- Character silhouette/initial on left
- Name, gamer tag, department
- Win/loss record badge
- Glow border on hover

**MatchCard:**
- "VS" layout: Player A | VS | Player B
- Character icons flanking
- Score below if completed
- Status badge top-right
- Featured matches get gold border
- Upsets get red "UPSET" badge

**LeaderboardRow:**
- Rank number with metallic style for top 3
- Player info (avatar + tag)
- Stats columns
- Highlighted zone backgrounds (top 4 / top 8)
- Expandable on click for detailed stats

**BracketView:**
- SVG or CSS grid based bracket
- Lines connecting matches
- Completed matches show winner highlighted
- Streak mode shows fire icons for active streaks

---

## 11. CLIENT ROUTING

```
/                           → Landing (list tournaments)
/create                     → Create tournament form
/t/:slug/dashboard          → Admin dashboard
/t/:slug/players            → Player management
/t/:slug/fixtures           → Fixture list + scheduling
/t/:slug/match/:matchId     → Match result entry
/t/:slug/leaderboard        → Full leaderboard
/t/:slug/matches            → Match center
/t/:slug/player/:playerId   → Player profile
/t/:slug/playoffs           → Playoff bracket
/:slug                      → Public view (no /t/ prefix)
```

**Route protection:**
- `/t/:slug/*` routes check for JWT in localStorage
- If no JWT, redirect to a login modal/page for that tournament
- `/:slug` is always public

---

## 12. ENV VARIABLES

```env
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tournamently
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

# Client (Vite)
VITE_API_URL=http://localhost:5000/api
```

---

## 13. DEVELOPMENT SCRIPTS

```json
// Root package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "cd client && npm run build && cd ../server && npm run build",
    "seed": "cd server && npx ts-node src/seed/tmtekken.ts",
    "start": "cd server && npm start"
  }
}
```

---

## 14. KEY IMPLEMENTATION NOTES

### Fixtures Generation — Circle Method Implementation
```
For n players (pad to even if odd by adding BYE):
  Fix player at index 0
  Rotating pool = players[1..n-1]

  For round r = 0 to n-2:
    Pair player[0] with rotating[n-2-r] (or last element)
    Pair rotating[i] with rotating[n-2-i-1] for i = 0..(n/2-2)
    Rotate the pool (shift right by 1)
```

### Leaderboard — Avoid N+1 Queries
Fetch all completed matches for tournament in ONE query, then compute leaderboard in memory. Don't query per-player.

### Bonus Points — Losers Earn Them Too
Critical: both playerAStats and playerBStats on a match result are independent. A player who lost can still have perfect rounds or fast wins, and those bonus points count toward their leaderboard total.

### Streak Mode — Admin Submits Game by Game
For streak mode playoff matches, the API accepts one game result at a time (PUT `/playoffs/:mid/streak-game` with `{ winner: playerId }`). The server:
1. Appends winner to sequence array
2. Recalculates streaks
3. Checks if any streak reached target
4. If yes, sets match as completed with that player as winner
5. If maxGameCap reached with no winner, resolves by total game wins → sudden death

### Public View — Single Aggregated Endpoint
`GET /api/public/:slug` returns everything the public page needs in one call:
```typescript
{
  tournament: ITournament,
  leaderboard: ILeaderboardRow[],
  todayMatches: IMatch[],
  recentResults: IMatch[],       // Last 10 completed
  upcomingMatches: IMatch[],     // Next 10 scheduled
  featuredMatches: IMatch[],
  playoffs: IPlayoffMatch[] | null,
  stats: {
    totalMatches: number,
    completedMatches: number,
    playersCount: number,
  }
}
```

### Player Deletion / Addition Constraints
- Players can be added/edited/deleted freely when `fixturesGenerated === false`
- Once fixtures are generated, player roster is locked
- To modify players, admin must reset fixtures (deletes all fixtures + results)
- Confirmation modal required before fixture reset

### Match Result Editing
- Admin can edit or clear a submitted result
- Clearing a result sets match back to 'scheduled', removes stats
- Leaderboard recalculates on every view (or use a debounced cache with 30s TTL)

---

## 15. ERROR HANDLING

### Server
- Express error handler middleware catches all thrown errors
- Custom `AppError` class with statusCode and message
- Mongoose validation errors → 400 with field-level messages
- 404 for not-found resources
- 401/403 for auth failures
- All errors return `{ error: true, message: string, details?: any }`

### Client
- API service wraps all calls in try/catch
- Toast notifications for errors (use a simple toast component)
- Optimistic updates where safe (e.g., toggling featured), rollback on error
- Loading and error states on every data-fetching component

---

## 16. TESTING GUIDANCE (Future)

- Unit tests for: `fixtureGenerator`, `leaderboardCalculator`, `tiebreaker`, `streakMode`
- Integration tests for API routes
- E2E: create tournament → add players → generate fixtures → enter results → check leaderboard
- Recommended: Vitest (client), Jest (server), Playwright (E2E)

---

## 17. DEPLOYMENT NOTES

- Client: Build with Vite, serve static from Express or deploy to Vercel/Netlify
- Server: Node.js process (PM2 or Docker)
- MongoDB: Atlas or self-hosted
- For `tournamently.in/[slug]` routing: configure DNS + reverse proxy (nginx) or use Vercel rewrites
- In production, serve client build from Express `public/` folder for simplest setup

---

## 18. BUILD ORDER (Recommended)

Follow this sequence to avoid blocked dependencies:

1. **Project scaffolding** — monorepo, packages, TypeScript configs, Tailwind setup
2. **Database models** — Tournament, Player, Match, PlayoffMatch schemas
3. **Auth** — password hashing, JWT, middleware
4. **Tournament CRUD** — create/read/update with slug validation
5. **Player CRUD** — add/edit/delete with lock constraints
6. **Fixture generation** — round-robin algorithm + scheduling
7. **Match result entry** — submission + validation + bonus calculation
8. **Leaderboard** — aggregation + tiebreaking
9. **Playoffs** — bracket creation + normal mode results
10. **Streak mode** — game-by-game submission + streak tracking
11. **Public API** — aggregated endpoint
12. **Seed script** — TMtekken demo data
13. **Frontend: Shell** — routing, layout, theme, auth context
14. **Frontend: Landing + Create** — tournament list + creation form
15. **Frontend: Dashboard** — stats, quick links, today's matches
16. **Frontend: Players** — CRUD cards with character picker
17. **Frontend: Fixtures** — list, filters, date editing, schedule view
18. **Frontend: Match Result** — form with game-by-game input
19. **Frontend: Leaderboard** — sortable table with rank zones
20. **Frontend: Match Center** — filterable match list
21. **Frontend: Player Profile** — stats + match history
22. **Frontend: Playoffs** — bracket visualization + result entry
23. **Frontend: Public View** — responsive multi-section page
24. **Polish** — animations, loading states, error handling, mobile optimization

---

## 19. THINGS THE SPEC LEFT IMPLICIT (Filled In)

| Gap | Decision |
|-----|----------|
| How are fixtures ordered? | Circle method for balanced scheduling; each player gets evenly spaced matches |
| What if odd number of players? | Add a BYE; player vs BYE = rest round (no match counted) |
| Can admin edit a completed match? | Yes — edit or clear result. Leaderboard recalculates. |
| What does "fast win" mean exactly? | A round won in under 10 seconds (configurable threshold). Tracked per-round, not per-game. |
| How does public view auto-update? | Polling every 30 seconds on public view (future: WebSocket) |
| Multiple tournaments? | Supported from day 1 — landing page lists all tournaments |
| Can playoff format differ per round? | MVP: uniform format across all playoff rounds. Future: per-round config |
| What happens if admin changes playerCount after creation? | playerCount is advisory; actual count is determined by roster. Fixture generation uses actual roster size. |
| What's the character avatar solution? | Generate colored circle with character initials + a subtle background pattern per character. No external images required. |
| How to handle timezone? | Store all dates as UTC. Display in browser's local timezone. |
| Is there a 3rd place match in playoffs? | Not in MVP. Future addition. |
| Can admin manually reorder/override leaderboard? | No. Leaderboard is always computed from match data. |
| What about walkovers/forfeits? | Admin enters result as 2-0 with winner being the present player. Add a "forfeit" flag to match result (optional future field). |
| Max game cap resolution in streak mode | If cap reached: player with more total wins in sequence wins. If still tied: next game is sudden death (first to win takes match). |
| Dashboard "overdue matches" | Matches with scheduledDate < today AND status === 'scheduled' |