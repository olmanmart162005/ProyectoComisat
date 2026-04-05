import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  GridIcon,
  HorizontaLDots,
  ListIcon,
  GroupIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../auth/AuthProvider";
import supermarketLogo from "../icons/supermarket.svg";

// ── Estructura de navegación ───────────────────────────────────────
const navItems = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    allowedRoles: [
      "Administrador",
      "Gestor de Inventario",
      "Oficial de Credito",
      "Recursos Humanos",
      "Empleado",
    ],
  },
  {
    icon: <UserCircleIcon />,
    name: "Usuarios",
    path: "/usuarios",
    allowedRoles: ["Administrador"],
  },
  {
    name: "Empleados",
    icon: <GroupIcon />,
    path: "/empleados",
    allowedRoles: ["Administrador", "Recursos Humanos"],
  },
  {
    name: "Departamentos",
    icon: <ListIcon />,
    path: "/departamentos",
    allowedRoles: ["Administrador", "Recursos Humanos"],
  },
  {
    name: "Roles",
    icon: <ListIcon />,
    path: "/roles",
    allowedRoles: ["Administrador"],
  },
  {
    name: "Categorías",
    icon: <TableIcon />,
    path: "/categorias",
    allowedRoles: ["Administrador", "Gestor de Inventario"],
  },
  {
    name: "Productos",
    icon: <TableIcon />,
    path: "/productos",
    allowedRoles: ["Administrador", "Gestor de Inventario"],
  },
  {
    name: "Solicitudes Reservas",
    icon: <TableIcon />,
    path: "/solicitudes-reservas",
    allowedRoles: ["Administrador", "Oficial de Credito"],
  },
  {
    name: "Pagos Mensuales",
    icon: <TableIcon />,
    path: "/pagos-mensuales",
    allowedRoles: ["Oficial de Credito"],
  },
  {
    name: "Empleados",
    icon: <GroupIcon />,
    path: "/empleados-perfil",
    allowedRoles: ["Oficial de Credito"],
  },
  {
    name: "Configuración",
    icon: <PlugInIcon />,
    path: "/configuracion",
    allowedRoles: ["Administrador"],
  },
];

// ── Grupos colapsables ─────────────────────────────────────────────
// Agregar aquí nuevas secciones de auditoría sin tocar el render
const navGroups = [
  {
    name: "Auditoría",
    allowedRoles: [
      "Administrador",
      "Oficial de Credito",
      "Recursos Humanos",
      "Gestor de Inventario",
    ],
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 17v-2a4 4 0 014-4h4m0 0l-2-2m2 2l-2 2M3 7h4a2 2 0 012 2v6a2 2 0 01-2 2H3"
        />
      </svg>
    ),
    children: [
      {
        name: "Bitácora",
        icon: <ListIcon />,
        path: "/bitacora",
        allowedRoles: ["Administrador"],
      },
      {
        name: "Historial de Créditos",
        icon: <TableIcon />,
        path: "/historial-creditos",
        allowedRoles: ["Administrador", "Oficial de Credito"],
      },
      {
        name: "Historial de Empleados",
        icon: <TableIcon />,
        path: "/historial-empleados",
        allowedRoles: ["Administrador", "Recursos Humanos"],
      },
      {
        name: "Historial Productos",
        icon: <TableIcon />,
        path: "/historial-productos",
        allowedRoles: ["Administrador", "Gestor de Inventario"],
      },
    ],
  },
];

// ── Componente de ítem individual ──────────────────────────────────
function NavItem({ nav, showLabel }) {
  const { pathname } = useLocation();
  const isActive = pathname === nav.path;

  return (
    <li>
      <Link
        to={nav.path}
        className={`menu-item group ${
          isActive ? "menu-item-active" : "menu-item-inactive"
        } ${!showLabel ? "lg:justify-center" : "lg:justify-start"}`}
      >
        <span
          className={`menu-item-icon-size ${isActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}
        >
          {nav.icon}
        </span>
        {showLabel && <span className="menu-item-text">{nav.name}</span>}
      </Link>
    </li>
  );
}

// ── Componente de grupo colapsable ─────────────────────────────────
function NavGroup({ group, showLabel, role }) {
  const { pathname } = useLocation();

  // Filtra hijos visibles según rol
  const visibleChildren = group.children.filter(
    (c) => !c.allowedRoles || c.allowedRoles.includes(role),
  );

  if (visibleChildren.length === 0) return null;

  // Abre automáticamente si algún hijo está activo
  const hasActiveChild = visibleChildren.some((c) => pathname === c.path);
  const [open, setOpen] = useState(hasActiveChild);

  // Si la sidebar está colapsada, solo muestra el ícono sin el grupo
  if (!showLabel) {
    return (
      <li>
        <div className="menu-item group menu-item-inactive lg:justify-center">
          <span className="menu-item-icon-size menu-item-icon-inactive">
            {group.icon}
          </span>
        </div>
      </li>
    );
  }

  return (
    <li>
      {/* Botón del grupo */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="menu-item group menu-item-inactive lg:justify-start w-full"
      >
        <span className="menu-item-icon-size menu-item-icon-inactive">
          {group.icon}
        </span>
        <span className="menu-item-text flex-1 text-left">{group.name}</span>
        {/* Chevron animado */}
        <svg
          className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Sub-ítems con animación de apertura */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="mt-1 ml-4 flex flex-col gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
          {visibleChildren.map((child) => {
            const isActive = pathname === child.path;
            return (
              <li key={child.path}>
                <Link
                  to={child.path}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="w-4 h-4 shrink-0">{child.icon}</span>
                  {child.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </li>
  );
}

// ── Sidebar principal ──────────────────────────────────────────────
const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  const showLabel = isExpanded || isHovered || isMobileOpen;

  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role),
  );

  const visibleNavGroups = navGroups.filter(
    (g) => !g.allowedRoles || g.allowedRoles.includes(role),
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-72.5" : isHovered ? "w-72.5" : "w-22.5"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${!showLabel ? "lg:justify-center" : "justify-start"}`}
      >
        <Link to="/">
          {showLabel ? (
            <div className="flex items-center gap-3">
              <img
                className="shrink-0"
                src={supermarketLogo}
                alt="Logo"
                width={36}
                height={36}
              />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Comisariato
              </span>
            </div>
          ) : (
            <img src={supermarketLogo} alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!showLabel ? "lg:justify-center" : "justify-start"}`}
              >
                {showLabel ? "Menu" : <HorizontaLDots className="size-6" />}
              </h2>

              <ul className="flex flex-col gap-4">
                {/* Ítems normales */}
                {visibleNavItems.map((nav) => (
                  <NavItem key={nav.path} nav={nav} showLabel={showLabel} />
                ))}

                {/* Grupos colapsables */}
                {visibleNavGroups.map((group) => (
                  <NavGroup
                    key={group.name}
                    group={group}
                    showLabel={showLabel}
                    role={role}
                  />
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
