import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: Number(process.env.PORT || 5000),
  mongoUri:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/tournamently',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: '24h',
};
