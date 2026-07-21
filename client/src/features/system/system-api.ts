export type SystemHealth = { success: boolean; status: "ok" | "degraded"; database: "connected" | "disconnected" };

export const systemKeys = {
  health: ["system", "health"] as const
};

export function getSystemHealth(signal?: AbortSignal) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

  return fetch(`${baseUrl}/system/health`, { signal, credentials: "include" }).then(async (response) => {
    const payload = (await response.json()) as SystemHealth;
    if (!response.ok) throw new Error("The API is unavailable.");
    return payload;
  });
}
