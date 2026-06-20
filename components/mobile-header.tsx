"use client";

import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  Users,
  LogOut,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
import { useRouter } from "next/navigation";

export function MobileHeader() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { displayName, roleLabel, profile } = useCurrentUserProfile();
  const userStatus = profile?.status;
  const isActive = userStatus === "active";

  // const handleLogout = () => {
  //   clearAuthSession();
  // };

  const allNavItems = [
    {
      id: "painel",
      label: "Painel",
      icon: LayoutDashboard,
      href: "/voluntario/painel",
    },
    {
      id: "avaliacoes",
      label: "Avaliacoes",
      icon: ClipboardList,
      href: "/voluntario/avaliacoes",
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
    if ((item as Record<string, unknown>).hideWhenActive && isActive)
      return false;
    return true;
  });

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary overflow-hidden">
          <img
            src="/pacto-logo.png"
            alt="PACTO Logo"
            className="h-5 w-5 object-contain"
          />
        </div>
        <span className="text-lg font-bold text-foreground">PACTO</span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute inset-x-0 top-full border-b border-border bg-card shadow-lg">
          {/* Profile */}
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/20">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face"
                alt={`Foto de perfil de ${displayName}`}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="text-xs text-primary">{roleLabel}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-2">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCurrentRoute = pathname === item.href;
                const blocked = "requiresApproval" in item && !isActive;
                return (
                  <li key={item.id}>
                    <Link
                      href={blocked ? "#" : item.href}
                      onClick={
                        blocked
                          ? (e) => e.preventDefault()
                          : () => setIsOpen(false)
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                        blocked
                          ? "cursor-not-allowed text-muted-foreground/50"
                          : isCurrentRoute
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

          {/* Bottom Actions */}
          <div className="border-t border-border p-2">
            <Link
              href="/voluntario/perfil"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-5 w-5" />
              Meu Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Terminar Sessao
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
