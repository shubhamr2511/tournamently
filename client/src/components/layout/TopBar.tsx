import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function TopBar() {
  const { session, logout, isAdminOf } = useAuth();
  const { slug } = useParams();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-bg-secondary/80 backdrop-blur-md sticky top-0 z-40">
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="font-display text-2xl font-bold tracking-wider text-accent-yellow flex items-center gap-2"
        >
          <span className="bg-gradient-fire bg-clip-text text-transparent">
            TOURNA
          </span>
          <span>MENTLY</span>
        </Link>
        <div className="flex items-center gap-3">
          {slug && (
            <Link to={`/${slug}`} target="_blank">
              <Badge tone="purple">Public View</Badge>
            </Link>
          )}
          {session ? (
            <>
              <Badge tone="gold">
                Admin · {isAdminOf(slug || '') ? slug : session.slug}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Link to="/create">
              <Button size="sm">+ Create Tournament</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
