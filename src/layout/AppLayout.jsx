import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { IdleWarningModal } from "../components/ui/alert/IdleWarningModal";
import { useIdleLogout } from "../hooks/useIdleLogout";
import { useConfiguracionWeb } from "../hooks/useConfiguracionWeb";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // ── Idle timer ──────────────────────────────────────────────
  const { tiempoInactividad } = useConfiguracionWeb();
  const { mostrarAviso, continuar } = useIdleLogout(tiempoInactividad);

  // ── Gestión de títulos dinámicos ────────────────────────────
  const location = useLocation();

  useEffect(() => {
    const routeTitles = {
      "/": "Dashboard",
      "/usuarios": "Usuarios",
      "/usuarios/nuevo": "Nuevo Usuario",
      "/usuarios/editar": "Editar Usuario",
      "/usuarios/detalle": "Detalle de Usuario",
      "/empleados": "Empleados",
      "/empleados/nuevo": "Nuevo Empleado",
      "/empleados/editar": "Editar Empleado",
      "/empleados/detalle": "Detalle de Empleado",
      "/departamentos": "Departamentos",
      "/departamentos/nuevo": "Nuevo Departamento",
      "/departamentos/editar": "Editar Departamento",
      "/roles": "Roles",
      "/roles/nuevo": "Nuevo Rol",
      "/roles/editar": "Editar Rol",
      "/categorias": "Categorías",
      "/categorias/nueva": "Nueva Categoría",
      "/categorias/editar": "Editar Categoría",
      "/productos": "Productos",
      "/productos/nuevo": "Nuevo Producto",
      "/productos/editar": "Editar Producto",
      "/productos/detalle": "Detalle de Producto",
      "/productos/comentarios": "Comentarios de Producto",
      "/solicitudes-reservas": "Solicitudes de Crédito",
      "/solicitudes-reservas/detalle": "Detalle de Solicitud",
      "/pagos-mensuales": "Pagos Mensuales",
      "/historial-creditos": "Historial de Créditos",
      "/historial-creditos/detalle": "Detalle de Historial",
      "/empleados-perfil": "Perfiles de Crédito",
      "/empleados-perfil/detalle": "Detalle de Perfil",
      "/configuracion": "Configuración Global",
      "/bitacora": "Bitácora de Auditoría",
      "/historial-productos": "Historial de Productos",
      "/historial-empleados": "Historial de Empleados",
      "/activaciones": "Activaciones de Usuarios",
      "/dashboard": "Panel Administrador",
      "/dashboard-gestor": "Panel de Inventario",
      "/dashboard-oficial": "Panel de Créditos",
      "/dashboard-rrhh": "Panel de RRHH",
    };

    const currentTitle = routeTitles[location.pathname] || "Portal Administrativo";
    document.title = `${currentTitle} | Comisariato San José`;
  }, [location]);

  // ────────────────────────────────────────────────────────────

  return (
    <>
      <IdleWarningModal isOpen={mostrarAviso} onContinuar={continuar} />
      <div className="min-h-screen xl:flex">
        <div>
          <AppSidebar />
          <Backdrop />
        </div>
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isExpanded || isHovered ? "lg:ml-72.5" : "lg:ml-22.5"
          } ${isMobileOpen ? "ml-0" : ""} bg-gray-50 dark:bg-gray-900`}
        >
          <AppHeader />
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 text-gray-900 dark:text-gray-100">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
