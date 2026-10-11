"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUserProfile,
  getStoredAuthToken,
  getStoredAuthUser,
  PROFILE_SNAPSHOT_KEY,
  type CurrentUserProfile,
} from "@/lib/api";

interface ProfileContextValue {
  profile: CurrentUserProfile | null;
  loading: boolean;
  error: string;
  reload: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Persist the last known profile so pages can render instantly on reload. */
function cacheProfileSnapshot(data: CurrentUserProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_SNAPSHOT_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable — non-fatal
  }
}

/** Keep the `auth_user` copy in sync so page-level status/role reads stay fresh. */
function syncStoredAuthUser(data: CurrentUserProfile) {
  if (typeof window === "undefined") return;
  const stored = getStoredAuthUser();
  if (!stored) return;
  try {
    const storedRecord = { ...stored } as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...storedRecord,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      gender: data.gender ?? storedRecord.gender,
      photo: data.photo ?? storedRecord.photo,
    };
    localStorage.setItem("auth_user", JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Fetches the current user's profile ONCE per provider mount and shares it
 * with every consumer (AuthGuard, sidebars, mobile headers) via context.
 *
 * Previously each of those components fired its own `GET /users/me`, producing
 * several duplicate requests per page. With a single provider mounted once in
 * the root layout, only one request is made regardless of how many consumers
 * exist on the page.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  // Instant paint from the last snapshot; the network fetch below always
  // runs and replaces it with fresh data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(PROFILE_SNAPSHOT_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as CurrentUserProfile;
      if (snapshot?.id) setProfile((current) => current ?? snapshot);
    } catch {
      // ignore corrupt snapshot
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      const token = getStoredAuthToken();
      if (!token) {
        if (isMounted) {
          setProfile(null);
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
          cacheProfileSnapshot(data);
          syncStoredAuthUser(data);
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
  }, [reloadKey]);

  const reload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, error, reload }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }
  return ctx;
}
