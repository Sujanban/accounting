import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingScreen } from "../../components/loading-screen";
import { useAuth } from "./auth-provider";

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;
  if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
