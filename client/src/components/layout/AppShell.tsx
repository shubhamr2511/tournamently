import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const { slug } = useParams();
  const location = useLocation();
  const onAdminRoute = location.pathname.startsWith('/t/');

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <div className="flex-1 flex">
        {onAdminRoute && slug && <Sidebar slug={slug} />}
        <main className="flex-1 p-6 overflow-x-hidden animate-slide-up">
          <Outlet />
        </main>
      </div>
      <footer className="px-6 py-4 text-xs text-text-muted border-t border-border flex items-center justify-between">
        <span className="font-display uppercase tracking-widest">
          TournaMently
        </span>
        <Link to="/" className="hover:text-accent-yellow transition-colors">
          home
        </Link>
      </footer>
    </div>
  );
}
