import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";
import AppLayout from "../layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import Empleados from "../pages/Empleados";
import Login from "../pages/Login";
import NoEncontrado from "../pages/NoEncontrado";
import Productos from "../pages/Productos";
import Usuarios from "../pages/Usuarios";

export default function AppRouter() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/login" element={<Navigate to="/login" replace />} />
      <Route path="/noencontrado" element={<NoEncontrado />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="empleados" element={<Empleados />} />
        <Route path="productos" element={<Productos />} />
      </Route>

      <Route path="*" element={<Navigate to="/noencontrado" replace />} />
    </Routes>
  );
}
