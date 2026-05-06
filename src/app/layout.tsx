import { ClipboardList, FlaskConical, History, Layers3, PackagePlus } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAtomValue } from 'jotai';

import { Badge } from '@/components/ui/badge';
import { currentProductionRunAtom } from '@/lib/production-run-store';
import { cn } from '@/lib/utils';

const SMJ_LOGO_URL = 'https://www.smjaleel.net/wp-content/uploads/2025/04/SMJaleel-Logo-and-tagline-2.png';

const navItems = [
  { to: '/', label: 'Run Setup', icon: PackagePlus },
  { to: '/primary-packaging', label: 'Primary', icon: ClipboardList },
  { to: '/secondary-packaging', label: 'Secondary', icon: Layers3 },
  { to: '/product-specs', label: 'Specs', icon: FlaskConical },
  { to: '/history', label: 'History', icon: History },
];

export function AppLayout() {
  const currentRun = useAtomValue(currentProductionRunAtom);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/14 via-accent/8 to-transparent" />
      <div className="pointer-events-none absolute -left-16 top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-primary/10 bg-white/88 p-5 shadow-[0_24px_70px_rgba(37,99,235,0.10)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex w-fit items-center rounded-[1.5rem] border border-primary/10 bg-white px-4 py-3 shadow-sm">
                <img src={SMJ_LOGO_URL} alt="SM Jaleel logo" className="h-12 w-auto object-contain sm:h-14" />
              </div>
              <div className="space-y-2">
                <Badge variant="success" className="w-fit">
                  SM Jaleel QA Workflow
                </Badge>
                <h1 className="font-serif text-3xl font-semibold tracking-tight text-primary">Packaging inspection workflow</h1>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/10 bg-white/90 px-4 py-3 text-sm text-secondary-foreground shadow-sm">
            {currentRun ? (
              <div className="space-y-1">
                <div className="font-semibold text-primary">{currentRun.productioncode}</div>
                <div>
                  {currentRun.brand} | {currentRun.flavour} | {currentRun.packageType}
                </div>
              </div>
            ) : (
              <span>Select a production run to begin</span>
            )}
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-primary/10 bg-white/75 text-foreground hover:border-accent/30 hover:bg-secondary/80',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
