"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUserProfile,
  getStoredAuthToken,
  clearAuthSession,
  getDashboardRouteForRole,
  type CurrentUserProfile,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type AllowedStatus = "any" | "active" | "pending_test" | "pending_approval" | "pending_admin_approval";

interface AuthGuardProps {
  roles?: string[];
  statuses?: AllowedStatus[];
  redirectIfAuthenticated?: boolean;
  loading?: React.ReactNode;
  children: React.ReactNode | ((profile: CurrentUserProfile) => React.ReactNode);
}

export function AuthGuard({
  roles,
  statuses = ["any"],
  redirectIfAuthenticated = false,
  loading,
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [retry, setRetry] = useState(0);

  const doCheck = useCallback(() => {
    setAuthError(false);
    setChecking(true);

    const token = getStoredAuthToken();
    if (!token) {
      if (!redirectIfAuthenticated) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
      return;
    }

    getCurrentUserProfile(token)
      .then((prof) => {
        setProfile(prof);

        if (redirectIfAuthenticated) {
          router.replace(getDashboardRouteForRole(prof.role));
          return;
        }

        if (roles && roles.length > 0 && !roles.includes(prof.role)) {
          router.replace(getDashboardRouteForRole(prof.role));
          return;
        }

        if (statuses.length > 0 && !statuses.includes("any")) {
          if (!statuses.includes(prof.status as AllowedStatus)) {
            router.replace(getDashboardRouteForRole(prof.role));
            return;
          }
        }

        if (prof.status === "inactive") {
          router.replace("/");
          return;
        }

        setChecking(false);
      })
      .catch(() => {
        setAuthError(true);
        setChecking(false);
      });
  }, []);

  useEffect(() => {
    doCheck();
  }, [doCheck, retry]);

  if (checking || redirectIfAuthenticated) {
    return (
      loading || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">A carregar...</p>
          </div>
        </div>
      )
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto max-w-sm text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Falha na ligacao</h2>
          <p className="text-sm text-muted-foreground">
            Nao foi possivel verificar a sua sessao. Verifique a sua ligacao
            a internet e tente novamente.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              className="rounded-xl"
              onClick={() => setRetry((r) => r + 1)}
            >
              Tentar novamente
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                clearAuthSession();
                router.replace("/login");
              }}
            >
              Voltar ao inicio de sessao
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !redirectIfAuthenticated) return null;

  if (typeof children === "function" && profile) {
    return <>{children(profile)}</>;
  }

  return <>{children}</>;
}
