import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const RoleRoute = ({ children, roles }) => {
  const { user, role, estado, loading } = useAuth();

  if (loading) return <div>Cargando permisos...</div>;

  // No autenticado
  if (!user) return <Navigate to="/login" replace />;

  // Inactivo
  if (estado?.toLowerCase() === "inactivo")
    return <Navigate to="/login" replace />;

  // Rol no permitido → acceso denegado
  if (!roles.includes(role))
    return <Navigate to="/acceso-denegado" replace />;

  return children;
};