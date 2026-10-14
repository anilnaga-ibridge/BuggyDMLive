"use client";

import { useQuery } from "@tanstack/react-query";

export function useActionQuery<T>(
  key: string,
  action: () => Promise<T>,
  refetchInterval?: number,
) {
  return useQuery({
    queryKey: [key],
    queryFn: action,
    refetchInterval,
  });
}
