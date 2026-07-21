import { apiClient } from "../../services/api-client";

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  isActive: boolean;
};

export type Session = {
  user: User;
  activeCompany: { id: string; name: string; activeFiscalYearId: string | null; onboardingCompleted: boolean } | null;
  activeMembership: { id: string; role: string } | null;
  memberships: Array<{ id: string; role: string; company: { id: string; name: string } | null }>;
};

type AuthResponse = { accessToken: string; session: Session };
export type LoginCredentials = { email: string; password: string };
export type RegisterCredentials = LoginCredentials & { name: string; confirmPassword: string };

export function login(credentials: LoginCredentials) {
  return apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuthRefresh: true
  });
}

export function register(credentials: RegisterCredentials) {
  return apiClient<{ user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuthRefresh: true
  });
}

export function refreshSession() {
  return apiClient<AuthResponse>("/auth/refresh", {
    method: "POST",
    skipAuthRefresh: true
  });
}

export function logout() {
  return apiClient<undefined>("/auth/logout", {
    method: "POST",
    skipAuthRefresh: true
  });
}
