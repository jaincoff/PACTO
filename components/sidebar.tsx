"use client";

import {
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  Users,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";

interface SidebarProps {
  activeItem?: string;
}

export function Sidebar({ activeItem = "painel" }: SidebarProps) {
  const router = useRouter();
  const { displayName, roleLabel, profile } = useCurrentUserProfile();
  const userStatus = profile?.status;
  const isActive = userStatus === "active";
  const isUnderReview = userStatus === "pending_approval" || userStatus === "pending_admin_approval";

  const allNavItems = [
    { id: "painel", label: "Painel", icon: LayoutDashboard, href: "/voluntario/painel" },
    {
      id: "avaliacoes",
      label: "Avaliacoes",
      icon: ClipboardList,
      href: "/voluntario/avaliacoes",
      hideWhenUnderReview: true,
    },
    {
      id: "adicionar",
      label: "Adicionar Idoso",
      icon: UserPlus,
      href: "/voluntario/painel?action=adicionar",
      requiresApproval: true,
    },
    {
      id: "gerir",
      label: "Gestao de Idosos",
      icon: Users,
      href: "/voluntario/painel?action=gerir",
      requiresApproval: true,
    },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.requiresApproval && !isActive) return false;
    if (item.hideWhenUnderReview && isUnderReview) return false;
    if ((item as Record<string, unknown>).hideWhenActive && isActive) return false;
    return true;
  });

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-border bg-card lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary overflow-hidden">
          <img
            src="/pacto-logo.png"
            alt="PACTO Logo"
            className="h-6 w-6 object-contain"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">PACTO</h1>
          <p className="text-xs text-primary">
            Voluntariado Compassivo
            <br />e Intergeracional
          </p>
        </div>
      </div>

      {/* Profile — clickable, goes to /perfil */}
      <Link href="/voluntario/perfil" className="flex flex-col items-center px-6 pb-4 transition-opacity hover:opacity-90">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-primary/20">
          <Image
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
            alt={`Foto de perfil de ${displayName}`}
            fill
            className="object-cover"
          />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{displayName}</h2>
        <span className="text-sm font-medium text-primary">{roleLabel}</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeItem === item.id;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                    active
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

      {/* Logout button */}
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
