import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PublicLayout } from './components/layout/PublicLayout';
import { Landing } from './pages/Landing';
import { CreateTournament } from './pages/CreateTournament';
import { EditTournament } from './pages/EditTournament';
import { Dashboard } from './pages/Dashboard';
import { Players } from './pages/Players';
import { Fixtures } from './pages/Fixtures';
import { MatchResult } from './pages/MatchResult';
import { Leaderboard } from './pages/Leaderboard';
import { MatchCenter } from './pages/MatchCenter';
import { PlayerProfile } from './pages/PlayerProfile';
import { Playoffs } from './pages/Playoffs';
import { PublicView } from './pages/PublicView';
import { Register } from './pages/Register';
import { Login } from './pages/Login';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateTournament />} />
        <Route path="/t/:slug/login" element={<Login />} />
        <Route path="/t/:slug/dashboard" element={<Dashboard />} />
        <Route path="/t/:slug/settings" element={<EditTournament />} />
        <Route path="/t/:slug/players" element={<Players />} />
        <Route path="/t/:slug/fixtures" element={<Fixtures />} />
        <Route
          path="/t/:slug/match/:matchId"
          element={<MatchResult />}
        />
        <Route path="/t/:slug/leaderboard" element={<Leaderboard />} />
        <Route path="/t/:slug/matches" element={<MatchCenter />} />
        <Route
          path="/t/:slug/player/:playerId"
          element={<PlayerProfile />}
        />
        <Route path="/t/:slug/playoffs" element={<Playoffs />} />
        <Route
          path="/t/:slug"
          element={<Navigate to="dashboard" replace />}
        />
      </Route>
      <Route element={<PublicLayout />}>
        <Route path="/:slug" element={<PublicView />} />
        <Route path="/:slug/register" element={<Register />} />
      </Route>
    </Routes>
  );
}
