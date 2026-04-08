import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/ui/table/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import ExportButtons from "../../layout/Exportbuttons";
import MetricCard from "../../components/common/MetricCard";
import { Toaster } from "sileo";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../../services/bitacora";
import { GroupIcon, CheckCircleIcon, CloseIcon } from "../../icons";
import { formatDateForFilename } from "../../utils/formatters";
import UsuariosFiltersDropdown from "../../components/Accesos/UsuariosFiltersDropdown";
import { useUsuarios } from "./hooks/useUsuarios";
import {
  usuarioColumns,
  COLUMNAS_EXPORT_USUARIOS,
} from "./columns/usuarioColumns";

export default function Gest_Usuarios() {
  Toaster.position = "top-right";

  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const {
    usuarios,
    empleados,
    roles,
    loading,
    filtroEstado,
    setFiltroEstado,
    filtroRol,
    setFiltroRol,
    totalUsuarios,
    usuariosActivos,
    usuariosInactivos,
    usuariosFiltrados,
    textoFiltrosPdf,
    handleEliminar,
  } = useUsuarios({ user, nombreEmpleado });

  const abrirEliminarUsuario = (uId) => {
    const usuario = usuarios.find((item) => item.id === uId) || null;
    setUsuarioAEliminar(usuario);
  };

  const cerrarEliminarUsuario = () => {
    if (eliminando) return;
    setUsuarioAEliminar(null);
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar?.id) return;
    setEliminando(true);
    const ok = await handleEliminar(usuarioAEliminar.id);
    setEliminando(false);
    if (ok) setUsuarioAEliminar(null);
  };

  const columns = usuarioColumns({
    onView: (usuario) =>
      navigate("/usuarios/detalle", {
        state: { usuario },
      }),
    onEdit: (usuario) =>
      navigate("/usuarios/editar", {
        state: { usuario },
      }),
    onEliminar: abrirEliminarUsuario,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Usuarios
        </h2>
        <button
          onClick={() => {
            navigate("/usuarios/nuevo");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
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
          Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Usuarios"
          value={totalUsuarios}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Usuarios Activos"
          value={usuariosActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Usuarios Inactivos"
          value={usuariosInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <DataTable columns={columns} data={usuariosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar usuario...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto items-stretch sm:items-center">
            <UsuariosFiltersDropdown
              roles={roles}
              filtroRol={filtroRol}
              setFiltroRol={setFiltroRol}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
            />

            <ExportButtons
              rows={usuariosFiltrados}
              columns={COLUMNAS_EXPORT_USUARIOS}
              filename={"Usuarios " + formatDateForFilename()}
              sheetName="Lista de Usuarios"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: textoFiltrosPdf || "Listado completo",
              }}
              pdfOptions={{
                title: "Usuarios",
                subtitle: formatDateForFilename(),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: nombreEmpleado,
                  coleccion: "usuarios",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: usuariosFiltrados.length,
                    filtros: textoFiltrosPdf || "Sin filtros",
                  },
                })
              }
            />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <ConfirmDeleteModal
        isOpen={Boolean(usuarioAEliminar)}
        onClose={cerrarEliminarUsuario}
        onConfirm={confirmarEliminarUsuario}
        itemName={usuarioAEliminar?.nombre}
        message="¿Deseas eliminar al usuario"
        loading={eliminando}
      />
    </div>
  );
}
