import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const RoleRoute = ({ children, roles, redirectToRoleHome = false }) => {
  const { user, role, estado, loading } = useAuth();

  if (loading) return <div>Cargando permisos...</div>;

  // No autenticado
  if (!user) return <Navigate to="/login" replace />;

  // Inactivo
  if (estado?.toLowerCase() === "inactivo")
    return <Navigate to="/login" replace />;

  // Dashboard routes can send users back to their role-specific landing page.
  if (!roles.includes(role)) {
    return <Navigate to={redirectToRoleHome ? "/" : "/acceso-denegado"} replace />;
  }

  return children;
};
