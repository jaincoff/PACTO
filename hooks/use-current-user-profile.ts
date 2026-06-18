"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCurrentUserProfile,
  getStoredAuthToken,
  type CurrentUserProfile,
} from "@/lib/api";

function roleToLabel(role?: string) {
  switch (role) {
    case "admin":
      return "Administrador";
    case "supervisor":
      return "Supervisora";
    case "elder":
      return "Idoso";
    case "volunteer":
    default:
      return "Voluntario";
  }
}

export function useCurrentUserProfile() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const token = getStoredAuthToken();
      if (!token) {
        if (isMounted) {
          setLoading(false);
          setError("Sessao expirada.");
        }
        return;
      }

      try {
        const data = await getCurrentUserProfile(token);
        if (isMounted) {
          setProfile(data);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Falha ao carregar perfil.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (!profile?.name) return "Utilizador PACTO";
    return profile.name;
  }, [profile?.name]);

  const roleLabel = useMemo(() => roleToLabel(profile?.role), [profile?.role]);

  return {
    profile,
    displayName,
    roleLabel,
    loading,
    error,
  };
}
