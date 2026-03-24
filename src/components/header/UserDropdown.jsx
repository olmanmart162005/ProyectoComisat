import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              fill="currentColor"
            />
            <path
              d="M12 14C7.58172 14 4 17.134 4 21H20C20 17.134 16.4183 14 12 14Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{userName}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
            className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
          >
            Cerrar sesión
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
