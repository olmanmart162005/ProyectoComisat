import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import ExportButtons from "../layout/Exportbuttons";
import MetricCard from "../components/common/MetricCard";
import { GroupIcon, CloseIcon, CheckCircleIcon } from "../icons";
import { useAuth } from "../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../services/bitacora";

const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";

export default function HistorialEmpleados() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();

  // Departamentos únicos extraídos del historial
  const departamentos = useMemo(() => {
    const deps = new Set(
      historial.map((h) => h.departamentoNombre).filter(Boolean),
    );
    return Array.from(deps).sort();
  }, [historial]);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "historialEmpleados"),
        orderBy("fechaBaja", "desc"),
      );
      const snap = await getDocs(q);
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar historial de empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const historialFiltrado = useMemo(() => {
    if (!filtroDepartamento) return historial;
    return historial.filter((h) => h.departamentoNombre === filtroDepartamento);
  }, [historial, filtroDepartamento]);

  // Métricas
  const mesActual = new Date();
  mesActual.setDate(1);
  mesActual.setHours(0, 0, 0, 0);

  const bajasEsteMes = historial.filter((h) => {
    const f = h.fechaBaja?.toDate?.();
    return f && f >= mesActual;
  }).length;

  const totalUsuariosEliminados = historial.reduce(
    (acc, h) => acc + (Number(h.usuariosEliminados) || 0),
    0,
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "codigoEmpleado",
        header: "Código",
      },
      {
        id: "nombreCompleto",
        header: "Nombre Completo",
        accessorFn: (row) =>
          `${row.nombres ?? ""} ${row.apellidos ?? ""}`.trim(),
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "dni",
        header: "DNI",
      },
      {
        accessorKey: "correo",
        header: "Correo",
        cell: (info) => (
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {info.getValue() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "departamentoNombre",
        header: "Departamento",
      },
      {
        accessorKey: "salario",
        header: "Salario",
        cell: (info) =>
          `L. ${Number(info.getValue() ?? 0).toLocaleString("es-HN")}`,
      },
      {
        accessorKey: "fechaRegistro",
        header: "Fecha Ingreso",
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
    ],
    [],
  );

  const COLUMNAS_EXPORT_HISTORIAL = [
    { key: "codigoEmpleado", header: "Código", type: "text" },
    { key: "nombres", header: "Nombres", type: "text" },
    { key: "apellidos", header: "Apellidos", type: "text" },
    { key: "dni", header: "DNI", type: "text" },
    { key: "correo", header: "Correo", type: "text" },
    { key: "departamentoNombre", header: "Departamento", type: "text" },
    { key: "salario", header: "Salario", type: "currency" },
    { key: "fechaRegistro", header: "Fecha Ingreso", type: "date" },
    { key: "fechaBaja", header: "Fecha Baja", type: "date" },
    { key: "nombreBajadoPor", header: "Dado de baja por", type: "text" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Empleados
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total en Historial"
          value={historial.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Bajas Este Mes"
          value={bajasEsteMes}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Usuarios Eliminados"
          value={totalUsuariosEliminados}
          icon={
            <CheckCircleIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      <DataTable columns={columns} data={historialFiltrado} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar empleado...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className={`w-full sm:w-52 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Departamento
              </option>
              {departamentos.map((dep) => (
                <option
                  key={dep}
                  value={dep}
                  className="bg-white text-gray-900"
                >
                  {dep}
                </option>
              ))}
            </select>

            <ExportButtons
              rows={historialFiltrado}
              columns={COLUMNAS_EXPORT_HISTORIAL}
              filename={
                "Historial Empleados " + new Date().toLocaleDateString("es-HN")
              }
              sheetName="Historial de Empleados"
              meta={{
                empresa: "Comisariato San Jose",
                usuario: nombreEmpleado || "Sistema",
                extra: filtroDepartamento
                  ? `Departamento: ${filtroDepartamento}`
                  : "Listado completo",
              }}
              pdfOptions={{
                title: "Historial de Empleados",
                subtitle: new Date().toLocaleDateString("es-HN"),
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: nombreEmpleado,
                  coleccion: "historialEmpleados",
                  accion: "exportar",
                  metadata: {
                    formato,
                    totalRegistros: historialFiltrado.length,
                    filtroDepartamento: filtroDepartamento || "Todos",
                  },
                })
              }
            />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}
