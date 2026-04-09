import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import AppToaster from "../components/common/AppToaster";

import ProtectedRoute from "../auth/ProtectedRoute";
import { ActiveRoute } from "../auth/ActiveRoute";
import { RoleRoute } from "../auth/RoleRoute";

import AppLayout from "../layout/AppLayout";
import Login from "../pages/Login";
import MetodosAcceso from "../pages/MetodosAcceso";
import { RoleRedirect } from "../auth/RoleRedirect";
import NotFound from "../pages/Errors/NotFound";
import AccesoDenegado from "../pages/Errors/AccesoDenegado";

// Dashboards por rol
import Dashboard from "../pages/Dashboards/Dashboard";
import DashboardGestor from "../pages/Dashboards/DashboardGestor";
import DashboardOficial from "../pages/Dashboards/DashboardOficial";
import DashboardRRHH from "../pages/Dashboards/DashboardRRHH";
import DescargaApp from "../pages/DescargaApp";

// Pantallas generales
import Gest_Empleados from "../pages/Personal/Gest_Empleados";
import Gest_Roles from "../pages/Accesos/Gest_Roles";
import RolesFormulario from "../pages/Accesos/RolesFormulario";
import Gest_Productos from "../pages/Inventario/Gest_Productos";
import ProductoDetalle from "../pages/Inventario/ProductoDetalle";
import ProductoFormulario from "../pages/Inventario/ProductoFormulario";
import Gest_ComentariosProducto from "../pages/Inventario/Gest_ComentariosProducto";
import Usuarios from "../pages/Accesos/Gest_Usuarios";
import ConfiguracionGlobal from "../pages/Gestion/Gest_ConfiguracionGlobal";
import Gest_SolicitudesCredito from "../pages/Creditos/Gest_SolicitudesCredito";
import SolicitudDetalle from "../pages/Creditos/SolicitudDetalle";
import PagosMensuales from "../pages/Creditos/PagosMensuales";
import HistorialCreditos from "../pages/Gestion/HistorialCreditos";
import EmpleadosPerfil from "../pages/Creditos/EmpleadosPerfil";
import PerfilEmpleadoDetalle from "../pages/Creditos/PerfilEmpleadoDetalle";
import EmpleadoDetalle from "../pages/Personal/EmpleadoDetalle";
import EmpleadoFormulario from "../pages/Personal/EmpleadoFormulario";
import Gest_Categorias from "../pages/Inventario/Gest_Categorias";
import CategoriaFormulario from "../pages/Inventario/CategoriaFormulario";
import Departamentos from "../pages/Personal/Gest_Departamentos";
import DepartamentoFormulario from "../pages/Personal/DepartamentoFormulario";
import UsuarioFormulario from "../pages/Accesos/UsuarioFormulario";
import UsuarioDetalle from "../pages/Accesos/UsuarioDetalle";
import Gest_Bitacora from "../pages/Gestion/Gest_Bitacora";
import HistorialProductos from "../pages/Gestion/HistorialProductos";
import HistorialEmpleados from "../pages/Gestion/HistorialEmpleados";

export default function AppRouter() {
  const { user } = useAuth();

  return (
    <>
      <AppToaster />
      <Routes>
        {/* Pública */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/login/metodos"
          element={user ? <Navigate to="/" replace /> : <MetodosAcceso />}
        />

        {/* Páginas de error — públicas */}
        <Route path="/acceso-denegado" element={<AccesoDenegado />} />
        <Route path="/noencontrado" element={<NotFound />} />

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
                <Gest_Empleados />
              </RoleRoute>
            }
          />
          <Route
            path="empleados/nuevo"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <EmpleadoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="empleados/editar"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <EmpleadoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="empleados/detalle"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <EmpleadoDetalle />
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
            path="departamentos/nuevo"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <DepartamentoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="departamentos/editar"
            element={
              <RoleRoute roles={["Administrador", "Recursos Humanos"]}>
                <DepartamentoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="roles"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Gest_Roles />
              </RoleRoute>
            }
          />
          <Route
            path="roles/nuevo"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RolesFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="roles/editar"
            element={
              <RoleRoute roles={["Administrador"]}>
                <RolesFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="categorias"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <Gest_Categorias />
              </RoleRoute>
            }
          />
          <Route
            path="categorias/nueva"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <CategoriaFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="categorias/editar"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <CategoriaFormulario />
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
            path="usuarios/nuevo"
            element={
              <RoleRoute roles={["Administrador"]}>
                <UsuarioFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="usuarios/editar"
            element={
              <RoleRoute roles={["Administrador"]}>
                <UsuarioFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="usuarios/detalle"
            element={
              <RoleRoute roles={["Administrador"]}>
                <UsuarioDetalle />
              </RoleRoute>
            }
          />
          <Route
            path="productos"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <Gest_Productos />
              </RoleRoute>
            }
          />
          <Route
            path="productos/nuevo"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <ProductoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="productos/editar"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <ProductoFormulario />
              </RoleRoute>
            }
          />
          <Route
            path="productos/detalle"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <ProductoDetalle />
              </RoleRoute>
            }
          />
          <Route
            path="productos/comentarios"
            element={
              <RoleRoute roles={["Administrador", "Gestor de Inventario"]}>
                <Gest_ComentariosProducto />
              </RoleRoute>
            }
          />
          <Route
            path="solicitudes-reservas"
            element={
              <RoleRoute roles={["Administrador", "Oficial de Credito"]}>
                <Gest_SolicitudesCredito />
              </RoleRoute>
            }
          />
          <Route
            path="solicitudes-reservas/detalle"
            element={
              <RoleRoute roles={["Administrador", "Oficial de Credito"]}>
                <SolicitudDetalle />
              </RoleRoute>
            }
          />
          <Route
            path="pagos-mensuales"
            element={
              <RoleRoute roles={["Administrador", "Oficial de Credito"]}>
                <PagosMensuales />
              </RoleRoute>
            }
          />
          <Route
            path="historial-creditos"
            element={
              <RoleRoute roles={["Administrador", "Oficial de Credito"]}>
                <HistorialCreditos />
              </RoleRoute>
            }
          />
          <Route
            path="empleados-perfil"
            element={
              <RoleRoute roles={["Oficial de Credito"]}>
                <EmpleadosPerfil />
              </RoleRoute>
            }
          />
          <Route
            path="empleados-perfil/detalle"
            element={
              <RoleRoute roles={["Oficial de Credito"]}>
                <PerfilEmpleadoDetalle />
              </RoleRoute>
            }
          />
          <Route
            path="bitacora"
            element={
              <RoleRoute roles={["Administrador"]}>
                <Gest_Bitacora />
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
