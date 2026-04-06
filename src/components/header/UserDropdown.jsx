import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const userName = user?.displayName || user?.email?.split("@")[0] || "Usuario";
  const userEmail = user?.email || "Sin correo";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al salir:", error);
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 flex items-center justify-center rounded-full h-11 w-11 bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <User size={20} />
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{userName}</span>
        <ChevronDown
          size={18}
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {userEmail}
          </span>
          <span className="mt-2 block text-theme-xs text-gray-500 dark:text-gray-400">
            Rol: {role || "Usuario"}
          </span>
        </div>

        <div className="pt-4 mt-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
