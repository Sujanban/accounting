import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../lib/query-client";
import { configureAccessTokenRefresh, setAccessToken } from "../../services/api-client";
import { login, logout, refreshSession, type LoginCredentials, type Session } from "./auth-api";

type AuthStatus = "loading" | "authenticated" | "anonymous";
type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setSession(null);
    setStatus("anonymous");
    queryClient.clear();
  }, []);

  const restoreSession = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;

    refreshPromise.current = refreshSession()
      .then((result) => {
        setAccessToken(result.accessToken);
        setSession(result.session);
        setStatus("authenticated");
        return true;
      })
      .catch(() => {
        clearSession();
        return false;
      })
      .finally(() => {
        refreshPromise.current = null;
      });

    return refreshPromise.current;
  }, [clearSession]);

  useEffect(() => {
    configureAccessTokenRefresh(restoreSession);
    void restoreSession();
    return () => configureAccessTokenRefresh(null);
  }, [restoreSession]);

  const loginMutation = useMutation({
    mutationFn: login,
    retry: false,
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      setSession(result.session);
      setStatus("authenticated");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    retry: false,
    onSettled: clearSession
  });

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const signOut = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value = useMemo(() => ({ status, session, login: signIn, logout: signOut }), [session, signIn, signOut, status]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
