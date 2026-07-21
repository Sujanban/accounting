import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/auth-provider";

export function RequireOnboarding() {
  const { session } = useAuth();

  if (!session?.activeCompany || !session.activeCompany.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
