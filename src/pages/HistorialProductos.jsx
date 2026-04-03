import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import MetricCard from "../components/common/MetricCard";
import { BoxIconLine, CloseIcon, CheckCircleIcon } from "../icons";

const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";

export default function HistorialProductos() {
  const [historial,        setHistorial]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filtroCategoria,  setFiltroCategoria]  = useState("");

  // Categorías únicas extraídas del historial
  const categorias = useMemo(() => {
    const cats = new Set(historial.map((h) => h.categoriaNombre).filter(Boolean));
    return Array.from(cats).sort();
  }, [historial]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "historialProductos"),
        orderBy("fechaBaja", "desc"),
      );
      const snap = await getDocs(q);
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar historial de productos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const historialFiltrado = useMemo(() => {
    if (!filtroCategoria) return historial;
    return historial.filter((h) => h.categoriaNombre === filtroCategoria);
  }, [historial, filtroCategoria]);

  // Métricas
  const mesActual = new Date();
  mesActual.setDate(1);
  mesActual.setHours(0, 0, 0, 0);

  const bajasEsteMes = historial.filter((h) => {
    const f = h.fechaBaja?.toDate?.();
    return f && f >= mesActual;
  }).length;

  const columns = useMemo(() => [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: (info) => (
        <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {info.getValue() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: (info) => info.getValue() ?? "—",
    },
    {
      accessorKey: "categoriaNombre",
      header: "Categoría",
      cell: (info) => info.getValue() ?? "—",
    },
    {
      accessorKey: "precioContado",
      header: "P. Contado",
      cell: (info) =>
        `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "precioCredito",
      header: "P. Crédito",
      cell: (info) =>
        `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "fechaRegistro",
      header: "Fecha Registro",
      cell: (info) => (
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "fechaBaja",
      header: "Fecha de Baja",
      cell: (info) => (
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {info.getValue()?.toDate?.()?.toLocaleDateString("es-HN") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "nombreBajadoPor",
      header: "Dado de baja por",
      cell: (info) => (
        <span className="block text-xs text-gray-600 dark:text-gray-400">
          {info.getValue() ?? "—"}
        </span>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Productos
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <MetricCard
          title="Total en Historial"
          value={historial.length}
          icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Bajas Este Mes"
          value={bajasEsteMes}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      <DataTable columns={columns} data={historialFiltrado} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar producto...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={`w-full sm:w-48 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">Categoría</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-gray-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}