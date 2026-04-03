import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Toaster } from "sileo";

import ProtectedRoute from "../auth/ProtectedRoute";
import { ActiveRoute } from "../auth/ActiveRoute";
import { RoleRoute } from "../auth/RoleRoute";

import AppLayout from "../layout/AppLayout";
import Login from "../pages/Login";
import { RoleRedirect } from "../auth/RoleRedirect";
import NoEncontrado from "../pages/NoEncontrado";
import AccesoDenegado from "../pages/AccesoDenegado";

// Dashboards por rol
import Dashboard from "../pages/Dashboard";
import DashboardGestor from "../pages/DashboardGestor";
import DashboardOficial from "../pages/DashboardOficial";
import DashboardRRHH from "../pages/DashboardRRHH";
import DescargaApp from "../pages/DescargaApp";

// Pantallas generales
import Empleados from "../pages/Empleados";
import Productos from "../pages/Productos";
import Usuarios from "../pages/Usuarios";
import ConfiguracionGlobal from "../pages/ConfiguracionGlobal";
import SolicitudesReservas from "../pages/SolicitudesReservas";
import PagosMensuales from "../pages/PagosMensuales";
import HistorialCreditos from "../pages/HistorialCreditos";
import Categorias from "../pages/Categorias";
import Departamentos from "../pages/Departamentos";
import Roles from "../pages/Roles";
import Bitacora from "../pages/Bitacora";
import HistorialProductos from "../pages/HistorialProductos";
import HistorialEmpleados from "../pages/HistorialEmpleados";

export default function AppRouter() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        {/* Pública */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        {/* Páginas de error — públicas */}
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        <Route path="/noencontrado" element={<NoEncontrado />} />

        {/* Panel principal: autenticado + activo */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ActiveRoute>
                <AppLayout />
              </ActiveRoute>
            </ProtectedRoute>
          }
        >
          {/* ── Dashboards por rol ────────────────────────────── */}

          <Route index element={<RoleRedirect />} />

          <Route
            path="dashboard"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Dashboard />
              </RoleRoute>
            }
          />

          <Route
            path="configuracion"
            element={
              <RoleRoute roles={["Administrador"]}>
                <ConfiguracionGlobal />
              </RoleRoute>
            }
          />

          <Route
            path="dashboard-gestor"
            element={
              <RoleRoute roles={["Gestor de Inventario"]}>
                <DashboardGestor />
              </RoleRoute>
            }
          />
          <Route
            path="dashboard-oficial"
            element={
              <RoleRoute roles={["Oficial de Crédito", "Oficial de Credito"]}>
                <DashboardOficial />
              </RoleRoute>
            }
          />
          <Route
            path="dashboard-rrhh"
            element={
              <RoleRoute roles={["Recursos Humanos"]}>
                <DashboardRRHH />
              </RoleRoute>
            }
          />
          <Route
            path="descarga-app"
            element={
              <RoleRoute roles={["Empleado"]}>
                <DescargaApp />
              </RoleRoute>
            }
          />

          {/* ── Pantallas compartidas (ejemplo) ──────────────── */}
          <Route
            path="empleados"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <Empleados />
              </RoleRoute>
            }
          />
          <Route
            path="departamentos"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <Departamentos />
              </RoleRoute>
            }
          />
          <Route
            path="roles"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Roles />
              </RoleRoute>
            }
          />
          <Route
            path="categorias"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <Categorias />
              </RoleRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Usuarios />
              </RoleRoute>
            }
          />
          <Route
            path="productos"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <Productos />
              </RoleRoute>
            }
          />
          <Route
            path="solicitudes-reservas"
            element={
              <RoleRoute
                roles={[
                  "Administrador",
                  "Oficial de Crédito",
                  "Oficial de Credito",
                ]}
              >
                <SolicitudesReservas />
              </RoleRoute>
            }
          />
          <Route
            path="pagos-mensuales"
            element={
              <RoleRoute roles={["Oficial de Crédito", "Oficial de Credito"]}>
                <PagosMensuales />
              </RoleRoute>
            }
          />
          <Route
            path="historial-creditos"
            element={
              <RoleRoute
                roles={[
                  "Administrador",
                  "Oficial de Crédito",
                  "Oficial de Credito",
                ]}
              >
                <HistorialCreditos />
              </RoleRoute>
            }
          />
          <Route
            path="bitacora"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Bitacora />
              </RoleRoute>
            }
          />
          <Route
            path="historial-productos"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <HistorialProductos />
              </RoleRoute>
            }
          />
          <Route
            path="historial-empleados"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <HistorialEmpleados />
              </RoleRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/noencontrado" replace />} />
      </Routes>
    </>
  );
}
