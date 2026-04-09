import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/ui/table/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { Toaster } from "sileo";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";

import { roleColumns, COLUMNAS_EXPORT_ROLES } from "./columns/roleColumns";
import { useRoles } from "./hooks/useRoles";

export default function Gest_Roles() {
  const navigate = useNavigate();
  Toaster.position = "top-right";

  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { roles, loading, fetchRoles, handleEliminar } = useRoles({
    user,
    nombreEmpleado,
  });
  const [rolAEliminar, setRolAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirEliminarRol = (rolId) => {
    const rol = roles.find((item) => item.id === rolId) || null;
    setRolAEliminar(rol);
  };

  const cerrarEliminarRol = () => {
    if (eliminando) return;
    setRolAEliminar(null);
  };

  const confirmarEliminarRol = async () => {
    if (!rolAEliminar?.id) return;
    setEliminando(true);
    const ok = await handleEliminar(rolAEliminar.id);
    setEliminando(false);
    if (ok) setRolAEliminar(null);
  };

  const columns = roleColumns({
    onEdit: (rol) => {
      navigate("/roles/editar", { state: { rol } });
    },
    onEliminar: abrirEliminarRol,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Roles
        </h2>
        <button
          onClick={() => navigate("/roles/nuevo")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition inline-flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Nuevo Rol
        </button>
      </div>

      <DataTable columns={columns} data={roles} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar rol...">
          <ExportButtons
            rows={roles}
            columns={COLUMNAS_EXPORT_ROLES}
            filename={"Roles " + formatDateForFilename()}
            sheetName="Lista de Roles"
            meta={{ empresa: "Comisariato San Jose", usuario: "Sistema" }}
            pdfOptions={{
              title: "Roles",
              subtitle: formatDateForFilename(),
            }}
            onExport={(formato) =>
              registrarBitacora({
                usuario: user.email,
                nombre: nombreEmpleado,
                coleccion: "roles",
                accion: "exportar",
                metadata: {
                  formato,
                  totalRegistros: roles.length,
                },
              })
            }
          />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <ConfirmDeleteModal
        isOpen={Boolean(rolAEliminar)}
        onClose={cerrarEliminarRol}
        onConfirm={confirmarEliminarRol}
        itemName={rolAEliminar?.nombre}
        message="¿Deseas eliminar el rol"
        loading={eliminando}
      />
    </div>
  );
}
