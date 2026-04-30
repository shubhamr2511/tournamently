import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, getErrorMessage } from '../services/api';

interface AuthSession {
  token: string;
  tournamentId: string;
  slug: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  isAdminOf: (slug: string) => boolean;
  login: (slug: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const raw = localStorage.getItem('tm_session');
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem('tm_session', JSON.stringify(session));
      localStorage.setItem('tm_token', session.token);
    } else {
      localStorage.removeItem('tm_session');
      localStorage.removeItem('tm_token');
    }
  }, [session]);

  const login = useCallback(async (slug: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { slug, password });
      setSession({
        token: data.token,
        tournamentId: data.tournament._id,
        slug: data.tournament.slug,
      });
    } catch (err) {
      throw new Error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const isAdminOf = useCallback(
    (slug: string) => session?.slug === slug,
    [session],
  );

  const value = useMemo(
    () => ({ session, login, logout, isAdminOf, loading }),
    [session, login, logout, isAdminOf, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
