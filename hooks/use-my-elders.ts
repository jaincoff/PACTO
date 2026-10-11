"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyElders, getStoredAuthToken, type ElderListItem } from "@/lib/api";

export function useMyElders() {
  return useQuery<ElderListItem[]>({
    queryKey: ["elders", "mine"],
    queryFn: () => {
      const token = getStoredAuthToken();
      if (!token) throw new Error("Sessao expirada.");
      return listMyElders(token);
    },
  });
}
