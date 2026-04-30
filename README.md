# TournaMently

A tournament management web app for office and friend group competitions. Fighting-game inspired UI, league + bonus + playoff modes.

## Quick start

```bash
# 1. Install
npm run install:all

# 2. Boot Mongo (or point MONGODB_URI at Atlas)
docker compose up -d mongo

# 3. Copy env template
cp .env.example .env
cp .env.example server/.env
cp .env.example client/.env

# 4. Seed the demo TMtekken tournament (admin password: admin123)
npm run seed

# 5. Run server + client together
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:5000
- Public view: http://localhost:5173/TMtekken

## Layout

```
client/   React + Vite + TS + Tailwind frontend
server/   Express + TS + Mongoose API
shared/   Cross-package TypeScript types
```

See [context_document.md](./context_document.md) for the full specification.
