import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config';
import { authRouter } from './routes/auth';
import { tournamentRouter } from './routes/tournament';
import { playerRouter } from './routes/player';
import { fixtureRouter } from './routes/fixture';
import { matchRouter } from './routes/match';
import { leaderboardRouter } from './routes/leaderboard';
import { playoffRouter } from './routes/playoff';
import { publicRouter } from './routes/public';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  if (config.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, env: config.nodeEnv }),
  );

  app.use('/api/auth', authRouter);
  app.use('/api/tournaments', tournamentRouter);
  app.use('/api/tournaments/:tid/players', playerRouter);
  app.use('/api/tournaments/:tid/fixtures', fixtureRouter);
  app.use('/api/tournaments/:tid/matches', matchRouter);
  app.use('/api/tournaments/:tid/leaderboard', leaderboardRouter);
  app.use('/api/tournaments/:tid/playoffs', playoffRouter);
  app.use('/api/public', publicRouter);

  app.use(errorHandler);
  return app;
}

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${config.mongoUri}`);
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[api] listening on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[fatal]', err);
    process.exit(1);
  });
}
