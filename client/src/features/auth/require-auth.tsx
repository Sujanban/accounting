import { Flex, Spinner } from "@radix-ui/themes";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-provider";

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <Flex align="center" justify="center" className="min-h-screen"><Spinner size="3" /></Flex>;
  if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
