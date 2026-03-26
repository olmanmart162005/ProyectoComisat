import { Link, useNavigate } from "react-router-dom";

import {
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../auth/AuthProvider";
import supermarketLogo from "../icons/supermarket.svg";

const navItems = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    allowedRoles: [
      "Administrador",
      "Gestor de Inventario",
      "Oficial de Crédito",
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
    icon: <ListIcon />,
    path: "/empleados",
    allowedRoles: ["Administrador", "Recursos Humanos"],
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
    allowedRoles: ["Administrador", "Oficial de Crédito"],
  },
  {
    name: "Pagos Mensuales",
    icon: <TableIcon />,
    path: "/pagos-mensuales",
    allowedRoles: ["Oficial de Crédito"],
  },
  {
    name: "Configuración",
    icon: <PlugInIcon />,
    path: "/configuracion",
    allowedRoles: ["Administrador"],
  },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { logout, role } = useAuth();
  const navigate = useNavigate();

  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || item.allowedRoles.includes(role),
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const renderMenuItems = (items) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.path && (
            <Link
              to={nav.path}
              className={`menu-item group menu-item-inactive ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span className="menu-item-icon-size menu-item-icon-inactive">
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-72.5"
            : isHovered
              ? "w-72.5"
              : "w-22.5"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
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
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(visibleNavItems)}
            </div>
          </div>
        </nav>


      </div>
    </aside>
  );
};

export default AppSidebar;
