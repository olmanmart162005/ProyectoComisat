import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const ActiveRoute = ({ children }) => {
  const { loading, estado, user } = useAuth();

  if (loading) return <div>Cargando permisos...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (estado?.toLowerCase() === "inactivo")
    return <Navigate to="/login" replace />;

  return children;
};