"use client";

import { useQuery } from "@tanstack/react-query";

export function useBadges(intervalSeconds = 15) {
  const query = useQuery({
    queryKey: ["ops-badges"],
    queryFn: async (): Promise<Record<string, number | null>> => {
      let res = await fetch("/BuggyDm/api/ops/badges");
      if (!res.ok) {
        res = await fetch("/api/ops/badges");
      }
      if (!res.ok) {
        throw new Error("Failed to fetch badge metrics");
      }
      const json = await res.json();
      return json.data || {};
    },
    refetchInterval: intervalSeconds * 1000,
    staleTime: intervalSeconds * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    badges: query.data || {},
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
