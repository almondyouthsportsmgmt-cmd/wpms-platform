import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading"><div>🐾</div><p>Preparing Whimsical Paws...</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
