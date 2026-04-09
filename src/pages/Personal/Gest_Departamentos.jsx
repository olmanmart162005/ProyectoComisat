import { useMemo } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/ui/table/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { Toaster } from "sileo";
import { registrarBitacora } from "../../services/bitacora";

import {
  departamentoColumns,
  COLUMNAS_EXPORT_DEPARTAMENTOS,
} from "./columns/departamentoColumns";
import { useDepartamentos } from "./hooks/useDepartamentos";

export default function Gest_Departamentos() {
  const navigate = useNavigate();
  Toaster.position = "top-right";

  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  const { departamentos, loading, handleEliminar } = useDepartamentos({
    closeModal: () => {},
  });

  const [departamentoAEliminar, setDepartamentoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirEliminarDepartamento = (depId) => {
    const dep = departamentos.find((item) => item.id === depId) || null;
    setDepartamentoAEliminar(dep);
  };

  const cerrarEliminarDepartamento = () => {
    if (eliminando) return;
    setDepartamentoAEliminar(null);
  };

  const confirmarEliminarDepartamento = async () => {
    if (!departamentoAEliminar?.id) return;
    setEliminando(true);
    const ok = await handleEliminar(departamentoAEliminar.id);
    setEliminando(false);
    if (ok) setDepartamentoAEliminar(null);
  };

  const columns = useMemo(
    () =>
      departamentoColumns({
        onEdit: (dep) => {
          navigate("/departamentos/editar", { state: { departamento: dep } });
        },
        onEliminar: abrirEliminarDepartamento,
      }),
    [navigate],
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Departamentos
        </h2>
        <button
          onClick={() => navigate("/departamentos/nuevo")}
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
          Nuevo Departamento
        </button>
      </div>

      <DataTable columns={columns} data={departamentos} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar departamento...">
          <ExportButtons
            rows={departamentos}
            columns={COLUMNAS_EXPORT_DEPARTAMENTOS}
            filename={"Departamentos " + new Date().toLocaleDateString("es-HN")}
            sheetName="Lista de Departamentos"
            meta={{ empresa: "Comisariato San Jose", usuario: "Sistema" }}
            pdfOptions={{
              title: "Departamentos",
              subtitle: new Date().toLocaleDateString("es-HN"),
            }}
            onExport={(formato) =>
              registrarBitacora({
                usuario: user.email,
                nombre: nombreEmpleado,
                coleccion: "departamentos",
                accion: "exportar",
                metadata: { formato, totalRegistros: departamentos.length },
              })
            }
          />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <ConfirmDeleteModal
        isOpen={Boolean(departamentoAEliminar)}
        onClose={cerrarEliminarDepartamento}
        onConfirm={confirmarEliminarDepartamento}
        itemName={departamentoAEliminar?.nombre}
        message="¿Deseas eliminar el departamento"
        loading={eliminando}
      />
    </div>
  );
}
