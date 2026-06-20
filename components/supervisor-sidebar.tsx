"use client";

import {
  LayoutDashboard,
  Users,
  Heart,
  ClipboardCheck,
  FileText,
  LogOut,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";

interface SupervisorSidebarProps {
  activeItem?: string;
}

export function SupervisorSidebar({ activeItem = "painel" }: SupervisorSidebarProps) {
  const router = useRouter();
  const { displayName, roleLabel, profile } = useCurrentUserProfile();
  const userStatus = profile?.status;

  const navItems = [
    { id: "painel", label: "Painel", icon: LayoutDashboard, href: "/supervisor/painel" },
    { id: "voluntarios", label: "Voluntários", icon: Users, href: "/supervisor/painel?action=voluntarios", requiresActive: true },
    { id: "idosos", label: "Idosos", icon: Heart, href: "/supervisor/painel?action=idosos", requiresActive: true },
    { id: "avaliacoes", label: "Avaliações", icon: ClipboardCheck, href: "/supervisor/avaliacoes" },
    { id: "relatorios", label: "Relatórios", icon: FileText, href: "/supervisor/relatorios", requiresActive: true },
  ];


  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <aside className="hidden sticky top-0 h-screen w-72 flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
          <img src="/pacto-logo.png" alt="PACTO Logo" className="h-6 w-6 object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">PACTO</h1>
          <p className="text-xs text-primary">Voluntariado Compassivo<br />e Intergeracional</p>
        </div>
      </div>

      <Link href="/supervisor/perfil" className="flex flex-col items-center px-6 pb-4 transition-opacity hover:opacity-90">
        <UserAvatar
          photo={profile?.photo}
          name={displayName}
          gender={profile?.gender}
          size={96}
          className="border-4 border-primary/20"
        />
        <h2 className="mt-3 text-lg font-semibold text-foreground">{displayName}</h2>
        <span className="text-sm font-medium text-primary">{roleLabel}</span>
      </Link>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.id;
            const blocked = (item as Record<string, unknown>).requiresActive && userStatus !== "active";
            return (
              <li key={item.id}>
                <Link
                  // href={item.href}
                  href={blocked ? "#" : item.href}
                  onClick={blocked ? (e) => e.preventDefault() : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    blocked
                      ? "cursor-not-allowed text-muted-foreground/50"
                      : active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-4 pb-6">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          Terminar Sessao
        </button>
      </div>
    </aside>
  );
}
