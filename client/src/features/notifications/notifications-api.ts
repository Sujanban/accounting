import { apiClient } from "../../services/api-client";

export type AppNotification = { id: string; type: string; title: string; message: string; resourcePath: string | null; readAt: string | null; createdAt: string };
export const notificationsApi = { list: (signal?: AbortSignal) => apiClient<AppNotification[]>("/notifications", { signal }), markRead: (id: string) => apiClient<AppNotification>(`/notifications/${id}/read`, { method: "PATCH" }) };
