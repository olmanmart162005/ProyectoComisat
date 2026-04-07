import { useMemo } from "react";

import DataTable from "../../components/ui/table/DataTable";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { useModal } from "../../hooks/useModal";
import { Toaster } from "sileo";
import { registrarBitacora } from "../../services/bitacora";

import DepartamentoModal from "../../components/Personal/DepartamentoModal";
import {
  departamentoColumns,
  COLUMNAS_EXPORT_DEPARTAMENTOS,
} from "./columns/departamentoColumns";
import { useDepartamentos } from "./hooks/useDepartamentos";

export default function Gest_Departamentos() {
  Toaster.position = "top-right";

  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  const {
    departamentos,
    loading,
    editandoId,
    setEditandoId,
    enviando,
    nombre,
    setNombre,
    handleSubmit,
    handleUpdate,
    handleEliminar,
  } = useDepartamentos({ closeModal });

  const columns = useMemo(
    () =>
      departamentoColumns({
        onEdit: (dep) => {
          setEditandoId(dep.id);
          setNombre(dep.nombre || "");
          openModal();
        },
        onEliminar: handleEliminar,
      }),
    [openModal, setEditandoId, setNombre, handleEliminar],
  );

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Departamentos
        </h2>
        <button
          onClick={() => {
            setEditandoId(null);
            setNombre("");
            openModal();
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
          Nuevo Departamento
        </button>
      </div>

      <DepartamentoModal
        isOpen={isOpen}
        onClose={closeModal}
        editandoId={editandoId}
        nombre={nombre}
        setNombre={setNombre}
        enviando={enviando}
        onSubmit={editandoId ? handleUpdate : handleSubmit}
      />

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
    </div>
  );
}
