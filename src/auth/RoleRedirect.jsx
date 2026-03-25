import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ROLE_HOME = {
  "Administrador":        "/dashboard",
  "Gestor de Inventario": "/dashboard-gestor",
  "Oficial de Credito":   "/dashboard-oficial",
  "Recursos Humanos":     "/dashboard-rrhh",
  "Empleado":             "/descarga-app",
};

export const RoleRedirect = () => {
  const { role, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  const destino = ROLE_HOME[role] ?? "/login";
  return <Navigate to={destino} replace />;
};