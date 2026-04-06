import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
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
