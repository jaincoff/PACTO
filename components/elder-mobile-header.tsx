"use client";

import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Heart,
  Smile,
  Phone,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { clearAuthSession } from "@/lib/api";
import { useCurrentUserProfile } from "@/hooks/use-current-user-profile";

export function ElderMobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { displayName, roleLabel } = useCurrentUserProfile();

  const navItems = [
    {
      id: "painel",
      label: "Painel",
      icon: LayoutDashboard,
      href: "/idoso/painel",
    },
    {
      id: "voluntario",
      label: "O Meu Voluntário",
      icon: Heart,
      href: "/idoso/voluntario",
    },
    {
      id: "bem-estar",
      label: "Bem-Estar",
      icon: Smile,
      href: "/idoso/bem-estar",
    },
    {
      id: "contactos",
      label: "Contactos",
      icon: Phone,
      href: "/idoso/contactos",
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Menu"
          className="h-12 w-12"
        >
          <Menu className="h-7 w-7" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-primary-foreground"
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
          <span className="text-xl font-bold text-foreground">PACTO</span>
        </div>

        <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20">
          <Image
            src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=200&h=200&fit=crop&crop=face"
            alt="Foto de perfil"
            fill
            className="object-cover"
          />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-0 left-0 top-0 w-80 animate-in slide-in-from-left duration-300">
            <div className="flex h-full flex-col bg-card">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6 text-primary-foreground"
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
                  <span className="text-xl font-bold">PACTO</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-12 w-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Profile */}
              <div className="flex flex-col items-center border-b border-border px-6 py-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-primary/20">
                  <Image
                    src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=200&h=200&fit=crop&crop=face"
                    alt={`Foto de perfil de ${displayName}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {displayName}
                </h2>
                <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {roleLabel}
                </span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-2">
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left text-base font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-secondary"
                          }`}
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon className="h-6 w-6" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              {/* Bottom Actions */}
              <div className="border-t border-border p-4 space-y-2">
                <Link
                  href="/idoso/perfil"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Meu Perfil
                </Link>
                <Link
                  href="/idoso/definicoes"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Definições
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  Terminar Sessão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
