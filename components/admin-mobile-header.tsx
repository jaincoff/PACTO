"use client";

import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Heart,
  UserCog,
  ClipboardList,
  Download,
  FileText,
  Settings,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";

export function AdminMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, profile } = useCurrentUserProfile();

  const navItems = [
    {
      id: "painel",
      label: "Painel",
      icon: LayoutDashboard,
      href: "/admin/painel",
    },
    {
      id: "utilizadores",
      label: "Utilizadores",
      icon: Users,
      href: "/admin/utilizadores",
    },
    // {
    //   id: "voluntarios",
    //   label: "Voluntários",
    //   icon: Heart,
    //   href: "/admin/voluntarios",
    // },
    // { id: "idosos", label: "Idosos", icon: User, href: "/admin/idosos" },
    // {
    //   id: "supervisores",
    //   label: "Supervisores",
    //   icon: UserCog,
    //   href: "/admin/supervisores",
    // },
    {
      id: "avaliacoes",
      label: "Gerir Avaliações",
      icon: ClipboardList,
      href: "/admin/avaliacoes",
    },
    {
      id: "exportacao",
      label: "Exportação de Dados",
      icon: Download,
      href: "/admin/exportacao",
    },
    // {
    //   id: "auditoria",
    //   label: "Auditoria",
    //   icon: FileText,
    //   href: "/admin/auditoria",
    // },
    // {
    //   id: "configuracoes",
    //   label: "Configurações",
    //   icon: Settings,
    //   href: "/admin/configuracoes",
    // },
  ];

  const handleLogout = () => {
    clearAuthSession();
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <>
      {/* Fixed Header */}
      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="text-foreground"
        >
          <Menu className="h-6 w-6" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-primary-foreground"
            >
              <circle cx="12" cy="6" r="2.5" fill="currentColor" />
              <circle cx="6" cy="10" r="2.5" fill="currentColor" />
              <circle cx="18" cy="10" r="2.5" fill="currentColor" />
              <path
                d="M12 10C12 10 8 14 8 16C8 18 10 20 12 20C14 20 16 18 16 16C16 14 12 10 12 10Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="font-bold text-foreground">PACTO</span>
        </div>

        <UserAvatar
          photo={profile?.photo}
          name={displayName}
          gender={profile?.gender}
          size={36}
          className="border-2 border-primary/20"
        />
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute bottom-0 left-0 top-0 w-80 animate-in slide-in-from-left duration-300">
            <div className="flex h-full flex-col bg-card shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5 text-primary-foreground"
                    >
                      <circle cx="12" cy="6" r="2.5" fill="currentColor" />
                      <circle cx="6" cy="10" r="2.5" fill="currentColor" />
                      <circle cx="18" cy="10" r="2.5" fill="currentColor" />
                      <path
                        d="M12 10C12 10 8 14 8 16C8 18 10 20 12 20C14 20 16 18 16 16C16 14 12 10 12 10Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className="font-bold text-foreground">PACTO Admin</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center border-b border-border px-4 py-6">
                <UserAvatar
                  photo={profile?.photo}
                  name={displayName}
                  gender={profile?.gender}
                  size={64}
                  className="border-4 border-primary/20"
                />
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  {displayName}
                </h2>
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Shield className="h-3.5 w-3.5" />
                  Administrador
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-2">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                          onClick={() => setIsOpen(false)}
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
              <div className="border-t border-border p-4">
                <ul className="space-y-1">
                  <li>
                    <Link
                      href="/admin/perfil"
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Meu Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin/configuracoes"
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Definições
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <LogOut className="h-5 w-5" />
                      Terminar Sessão
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
