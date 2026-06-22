import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity as ActivityIcon,
  Droplets,
  Dumbbell,
  Home,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAddFab } from "./quick-add-fab";
import { type ReactNode } from "react";

const nav = [
  { to: "/", label: "Daily Pulse", icon: Home, exact: true },
  { to: "/water", label: "Hidratação", icon: Droplets },
  { to: "/nutrition", label: "Nutrição", icon: UtensilsCrossed },
  { to: "/fitness", label: "Físico", icon: Dumbbell },
  { to: "/activities", label: "Atividades", icon: ActivityIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border/60 bg-sidebar/80 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl gold-3d">
            <span className="text-base font-black text-[oklch(0.2_0.05_70)]">Ω</span>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">OmniTrack</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Performance OS
            </div>
          </div>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = isActive(n.to, "exact" in n ? n.exact : false);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-sidebar-accent text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span>{n.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground",
              isActive("/settings") && "bg-sidebar-accent text-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </Link>
        </div>
      </aside>

      <main className="pb-28 md:pb-10 md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">{children}</div>
      </main>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-3 left-1/2 z-30 flex w-[min(96vw,440px)] -translate-x-1/2 items-center justify-between rounded-2xl border border-border bg-sidebar/85 px-2 py-2 backdrop-blur-xl shadow-[0_20px_60px_-20px_oklch(0_0_0/0.7)] md:hidden">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.to, "exact" in n ? n.exact : false);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{n.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <QuickAddFab />
    </div>
  );
}
