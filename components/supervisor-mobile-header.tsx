"use client";

import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Heart,
  ClipboardCheck,
  FileText,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";
// import { profile } from "console";

export function SupervisorMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, roleLabel, profile } = useCurrentUserProfile();
  const userStatus = profile?.status;

  const navItems = [
    {
      id: "painel",
      label: "Painel",
      icon: LayoutDashboard,
      href: "/supervisor/painel",
    },
    {
      id: "voluntarios",
      label: "Voluntários",
      icon: Users,
      href: "/supervisor/voluntarios",
      requiresActive: true
    },
    { id: "idosos",
      label: "Idosos",
      icon: Heart,
      href: "/supervisor/idosos",
      requiresActive: true
    },
    {
      id: "avaliacoes",
      label: "Avaliações",
      icon: ClipboardCheck,
      href: "/supervisor/avaliacoes",
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: FileText,
      href: "/supervisor/relatorios",
      requiresActive: true
    },
  ];

  const handleLogout = () => {
    clearAuthSession();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
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
          className="h-10 w-10"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-72 border-l border-border bg-card shadow-xl">
            {/* Menu Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <span className="font-semibold text-foreground">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Profile */}
            <div className="flex flex-col items-center border-b border-border p-6">
              <UserAvatar
                photo={profile?.photo}
                name={displayName}
                gender={profile?.gender}
                size={80}
                className="border-4 border-primary/20"
              />
              <h2 className="mt-3 text-lg font-semibold text-foreground">
                {displayName}
              </h2>
              <span className="text-sm font-medium text-primary">
                {roleLabel}
              </span>
            </div>

            {/* Navigation */}
            <nav className="p-2">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const blocked = (item as Record<string, unknown>).requiresActive && userStatus !== "active";
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
                            : isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                        // onClick={() => setIsOpen(false)}
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
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-2">
              <Link
                href="/supervisor/perfil"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-5 w-5" />
                Meu Perfil
              </Link>
              <Link
                href="/supervisor/definicoes"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Definições
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                Terminar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
