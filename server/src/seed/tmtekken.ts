import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Tournament, TEKKEN_CHARACTERS } from '../models/Tournament';
import { Player } from '../models/Player';
import { Match } from '../models/Match';
import { PlayoffMatch } from '../models/PlayoffMatch';

const SEED_PLAYERS = [
  {
    name: 'Snehil',
    gamerTag: 'Snehil',
    department: 'Founder',
    character: 'Jin Kazama',
  },
  {
    name: 'Rushi',
    gamerTag: 'Rushi',
    department: 'Engineering',
    character: 'Kazuya Mishima',
  },
  {
    name: 'Product Ninja',
    gamerTag: 'ProductNinja',
    department: 'Product',
    character: 'Yoshimitsu',
  },
  {
    name: 'Tech Warrior',
    gamerTag: 'TechWarrior',
    department: 'Engineering',
    character: 'Bryan Fury',
  },
  {
    name: 'Marketing Monk',
    gamerTag: 'MarketingMonk',
    department: 'Marketing',
    character: 'Lei Wulong',
  },
  {
    name: 'Design Samurai',
    gamerTag: 'DesignSamurai',
    department: 'Design',
    character: 'Hwoarang',
  },
  {
    name: 'Data Demon',
    gamerTag: 'DataDemon',
    department: 'Data',
    character: 'Devil Jin',
  },
  {
    name: 'HR Hustler',
    gamerTag: 'HRHustler',
    department: 'HR',
    character: 'King',
  },
];

async function run() {
  await mongoose.connect(config.mongoUri);
  console.log(`[seed] connected to ${config.mongoUri}`);

  const slug = 'TMtekken';
  await Tournament.deleteOne({ slug });
  const existing = await Tournament.findOne({ slug });
  if (existing) {
    await Promise.all([
      Player.deleteMany({ tournament: existing._id }),
      Match.deleteMany({ tournament: existing._id }),
      PlayoffMatch.deleteMany({ tournament: existing._id }),
    ]);
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  const t = await Tournament.create({
    name: 'TMtekken',
    slug,
    game: 'Tekken 8',
    description: 'The ultimate office Tekken showdown',
    format: 'round_robin',
    playerCount: SEED_PLAYERS.length,
    matchFormat: 'BO3',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-07-15'),
    matchesPerDay: 4,
    weekdaysOnly: true,
    status: 'registration',
    adminPassword,
    scoring: {
      perfectRoundBonus: 1,
      fastWinBonus: 1,
      fastWinThresholdSeconds: 10,
    },
    ranking: {
      primary: 'wins',
      tiebreakers: [
        'bonus_points',
        'head_to_head',
        'game_diff',
        'perfects',
        'fast_wins',
      ],
    },
    characterLock: false,
    availableCharacters: TEKKEN_CHARACTERS,
  });

  await Player.insertMany(
    SEED_PLAYERS.map((p) => ({
      ...p,
      tournament: t._id,
    })),
  );

  console.log(`[seed] tournament "${slug}" created (admin password: admin123)`);
  console.log(`[seed] inserted ${SEED_PLAYERS.length} players`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
