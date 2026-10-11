"use client";

import { useMemo } from "react";
import { useProfileContext } from "@/components/profile-provider";

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

/**
 * Reads the shared current-user profile from ProfileProvider context.
 *
 * The provider (mounted once in the root layout) is responsible for fetching
 * `GET /users/me`; every consumer of this hook shares that single result
 * instead of firing its own request.
 */
export function useCurrentUserProfile() {
  const { profile, loading, error } = useProfileContext();

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
