import { Outlet, Link } from 'react-router-dom';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-bg-secondary/60 backdrop-blur-md">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-xl tracking-wider text-accent-yellow"
          >
            <span className="bg-gradient-fire bg-clip-text text-transparent">
              TOURNA
            </span>
            MENTLY
          </Link>
          <span className="font-display uppercase text-xs tracking-widest text-text-muted">
            Public Broadcast
          </span>
        </div>
      </header>
      <main className="flex-1 animate-slide-up">
        <Outlet />
      </main>
    </div>
  );
}
