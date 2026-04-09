import { useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../components/ui/table/DataTable";
import ConfirmDeleteModal from "../../components/common/ConfirmDeleteModal";
import ExportButtons from "../../layout/Exportbuttons";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { PlusIcon } from "../../icons";
import { registrarBitacora } from "../../services/bitacora";
import { formatDateForFilename } from "../../utils/formatters";

import {
  categoryColumns,
  COLUMNAS_EXPORT_CATEGORIAS,
} from "./columns/categoryColumns";
import { useCategorias } from "./hooks/useCategorias";

export default function Gest_Categorias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const { categorias, loading, fetchCategorias, handleEliminar } =
    useCategorias({ user, nombreEmpleado });
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirEliminarCategoria = (catId) => {
    const cat = categorias.find((item) => item.id === catId) || null;
    setCategoriaAEliminar(cat);
  };

  const cerrarEliminarCategoria = () => {
    if (eliminando) return;
    setCategoriaAEliminar(null);
  };

  const confirmarEliminarCategoria = async () => {
    if (!categoriaAEliminar?.id) return;
    setEliminando(true);
    const ok = await handleEliminar(categoriaAEliminar.id);
    setEliminando(false);
    if (ok) setCategoriaAEliminar(null);
  };

  const columns = categoryColumns({
    onEdit: (cat) => {
      navigate("/categorias/editar", {
        state: { categoria: cat },
      });
    },
    onEliminar: abrirEliminarCategoria,
  });

  return (
    <div className="space-y-6">
      <div className="flex sm:justify-between flex-col sm:flex-row gap-4 items-start sm:items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Categorías
        </h2>
        <button
          onClick={() => {
            navigate("/categorias/nueva");
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Categoría
        </button>
      </div>

      <DataTable columns={columns} data={categorias} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar categoría...">
          <ExportButtons
            rows={categorias}
            columns={COLUMNAS_EXPORT_CATEGORIAS}
            filename={"Categorías " + formatDateForFilename()}
            sheetName="Lista de Categorías"
            meta={{ empresa: "Comisariato San Jose", usuario: "Sistema" }}
            pdfOptions={{
              title: "Categorías",
              subtitle: formatDateForFilename(),
            }}
            onExport={(formato) =>
              registrarBitacora({
                usuario: user.email,
                nombre: nombreEmpleado,
                coleccion: "categoria",
                accion: "exportar",
                metadata: {
                  formato,
                  totalRegistros: categorias.length,
                },
              })
            }
          />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <ConfirmDeleteModal
        isOpen={Boolean(categoriaAEliminar)}
        onClose={cerrarEliminarCategoria}
        onConfirm={confirmarEliminarCategoria}
        itemName={categoriaAEliminar?.nombre}
        message="¿Deseas eliminar la categoría"
        loading={eliminando}
      />
    </div>
  );
}
