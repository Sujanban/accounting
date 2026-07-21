import { apiClient, setAccessToken } from "../../services/api-client";

type LoginResponse = { accessToken: string; session: { user: { id: string; name: string; email: string } } };

export async function login(credentials: { email: string; password: string }) {
  const result = await apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
  setAccessToken(result.accessToken);
  return result;
}
