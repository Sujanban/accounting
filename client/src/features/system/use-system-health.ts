import { useQuery } from "@tanstack/react-query";
import { getSystemHealth, systemKeys } from "./system-api";

export function useSystemHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    queryFn: ({ signal }) => getSystemHealth(signal),
    retry: false,
    refetchInterval: 30_000
  });
}
