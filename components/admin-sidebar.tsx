"use client";

import {
  LayoutDashboard,
  Users,
  Heart,
  UserCog,
  ClipboardList,
  Download,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";

interface AdminSidebarProps {
  activeItem?: string;
}

export function AdminSidebar({ activeItem = "painel" }: AdminSidebarProps) {
  const router = useRouter();
  const { displayName, roleLabel } = useCurrentUserProfile();

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
    //{ id: "voluntarios", label: "Voluntarios", icon: Heart, href: "/admin/voluntarios" },
    //{ id: "idosos", label: "Idosos", icon: Users, href: "/admin/idosos" },
    //{ id: "supervisores", label: "Supervisores", icon: UserCog, href: "/admin/supervisores" },
    {
      id: "avaliacoes",
      label: "Gerir Avaliacoes",
      icon: ClipboardList,
      href: "/admin/avaliacoes",
    },
    {
      id: "exportacao",
      label: "Exportacao de Dados",
      icon: Download,
      href: "/admin/exportacao",
    },
    //{ id: "auditoria", label: "Auditoria", icon: FileText, href: "/admin/auditoria" },
    //{ id: "configuracoes", label: "Configuracoes", icon: Settings, href: "/admin/configuracoes" },
  ];

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <aside className="hidden  sticky top-0 h-screen w-72 flex-col border-r border-border bg-card lg:flex">
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
          <p className="text-xs text-primary">Painel de Administracao</p>
        </div>
      </div>

      {/* Profile — clickable */}
      <Link
        href="/admin/perfil"
        className="flex flex-col items-center px-6 pb-4 transition-opacity hover:opacity-90"
      >
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-primary/20">
          <Image
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
            alt={`Foto de ${displayName}`}
            fill
            className="object-cover"
          />
        </div>
        <h2 className="mt-2 text-base font-semibold text-foreground">
          {displayName}
        </h2>
        <span className="text-sm font-medium text-primary">{roleLabel}</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
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

      {/* Logout */}
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
