import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import MetricCard from "../components/common/MetricCard";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { BoxIconLine, CheckCircleIcon, GroupIcon, EyeIcon, CloseIcon } from "../icons";

// ── Helpers ────────────────────────────────────────────────────────
const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

const estadoCreditoColor = {
  Activo: "success",
  Aprobado: "success",
  Aceptado: "success",
  Rechazado: "error",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};

// ── Cálculo de estado del empleado (igual que productos) ──────────
const getEstadoEmpleado = (empleado) => {
  if (empleado.estado === "Inactivo") return "Inactivo";
  return "Activo";
};

const estadoEmpleadoColor = {
  Activo: "success",
  Inactivo: "error",
};

// ── Modal de Perfil del Empleado ───────────────────────────────────
function PerfilEmpleadoModal({
  isOpen,
  onClose,
  empleado,
  creditos,
  loading,
  porcentajeLimite,
}) {
  if (!empleado) return null;

  // ── Resumen financiero calculado ──────────────────────────────
  const esCreditoActivo = (c) => {
    const aprobado = String(c.estado ?? "").toLowerCase() === "aprobado";
    const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
    const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
      estadoCredito,
    );
    return aprobado && sigueActivo;
  };

  const creditosActivos = creditos.filter(esCreditoActivo);

  const historialCreditos = creditos
    .filter((c) =>
      ["aprobado", "aceptado", "rechazado", "cancelado"].includes(
        String(c.estado ?? "").toLowerCase(),
      ),
    )
    .sort((a, b) => {
      const fa =
        a.fechaAutoriza?.toMillis?.() ?? a.fechaRegistro?.toMillis?.() ?? 0;
      const fb =
        b.fechaAutoriza?.toMillis?.() ?? b.fechaRegistro?.toMillis?.() ?? 0;
      return fb - fa;
    });

  const cuotaMensualActiva = creditosActivos.reduce(
    (acc, c) =>
      acc +
      Number(c.datosFinancierosHistoricos?.cuotaMensual ?? c.cuotaMensual ?? 0),
    0,
  );
  const saldoPendienteTotal = creditosActivos.reduce(
    (acc, c) => acc + Number(c.saldoPendiente ?? 0),
    0,
  );

  const limiteCapacidad = (empleado.salario ?? 0) * (porcentajeLimite ?? 0);
  const disponible = Math.max(0, limiteCapacidad - cuotaMensualActiva);
  const porcentajeUsado =
    limiteCapacidad > 0
      ? Math.min(100, Math.round((cuotaMensualActiva / limiteCapacidad) * 100))
      : 0;
  const excedeLimite = cuotaMensualActiva >= limiteCapacidad;

  // ── Columnas historial (panel izquierdo) ──────────────────────
  const historialColumns = useMemo(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        cell: ({ row }) => {
          const fecha =
            row.original.fechaAutoriza ?? row.original.fechaRegistro;
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {fecha?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "productoNombre",
        header: "Producto",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
      {
        accessorKey: "estadoCredito",
        header: "Estado Crédito",
        cell: (info) => {
          const val = info.getValue() ?? "---";
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  // ── Columnas detalle créditos (panel derecho) ─────────────────
  const columnasCreditosDetalle = useMemo(
    () => [
      {
        accessorKey: "productoNombre",
        header: "Artículo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        id: "cuota",
        header: "Cuota/mes",
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.datosFinancierosHistoricos?.cuotaMensual)}
          </span>
        ),
      },
      {
        id: "progreso",
        header: "Progreso",
        cell: ({ row }) => {
          const pagadas = Number(row.original.cuotasPagadas ?? 0);
          const total = Number(
            row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
          );
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {pagadas} / {total}
            </span>
          );
        },
      },
      {
        accessorKey: "saldoPendiente",
        header: "Saldo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "estadoCredito",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue() ?? "Activo";
          return (
            <Badge size="sm" color={estadoCreditoColor[val] ?? "warning"}>
              {val}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-6xl">
      <div className="flex h-full max-h-[90vh] overflow-hidden rounded-xl">
        {/* ── Panel izquierdo — Historial de créditos ── */}
        <aside className="hidden md:flex flex-col w-[450px] shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 rounded-l-xl overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Perfil del Empleado
            </p>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mt-1">
              Historial de Créditos
            </h3>
          </div>

          <div className="flex-1 p-3 overflow-auto">
            <DataTable
              columns={historialColumns}
              data={historialCreditos}
              loading={loading}
            >
              <DataTable.Table emptyMessage="Sin historial de créditos" />
              <div className="[&>div]:mt-2 [&>div]:gap-2 [&>div>div:first-child]:hidden [&>div>div:last-child>span]:hidden [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs">
                <DataTable.Pagination />
              </div>
            </DataTable>
          </div>

          {/* Resumen rápido al pie */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Préstamos Activos
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {creditosActivos.length}
              </span>
            </div>
          </div>
        </aside>

        {/* ── Panel derecho ── */}
        <div className="flex flex-col flex-1 overflow-hidden rounded-r-xl bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Nombre y datos básicos */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-0.5">
                {empleado.nombres} {empleado.apellidos}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  size="sm"
                  color={
                    estadoEmpleadoColor[getEstadoEmpleado(empleado)] ??
                    "warning"
                  }
                >
                  {getEstadoEmpleado(empleado)}
                </Badge>
              </div>
            </div>

            {/* Datos del empleado */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Datos del Empleado
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    {
                      label: "Departamento",
                      value: empleado.departamentoNombre ?? "---",
                    },
                    { label: "Salario", value: lps(empleado.salario) },
                    { label: "DNI", value: empleado.dni ?? "---" },
                    { label: "Teléfono", value: empleado.telefono ?? "---" },
                    { label: "Correo", value: empleado.correo ?? "---" },
                    {
                      label: "Fecha Registro",
                      value:
                        empleado.fechaRegistro
                          ?.toDate?.()
                          ?.toLocaleDateString("es-HN") ?? "---",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Perfil financiero */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Perfil Financiero
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                  {[
                    {
                      label: "Salario Neto",
                      value: lps(empleado.salario),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: `Límite (${Math.round((porcentajeLimite ?? 0) * 100)}%)`,
                      value: lps(limiteCapacidad),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: "Crédito Utilizado",
                      value: lps(cuotaMensualActiva),
                      color: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                      label: "Disponible",
                      value: lps(disponible),
                      color: excedeLimite
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-700 dark:text-green-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {item.label}
                      </p>
                      <p
                        className={`text-xl leading-none font-bold tabular-nums whitespace-nowrap ${item.color}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Barra de capacidad usada */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Capacidad utilizada
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      {porcentajeUsado}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        excedeLimite
                          ? "bg-red-500 dark:bg-red-400"
                          : porcentajeUsado >= 75
                            ? "bg-yellow-500 dark:bg-yellow-400"
                            : "bg-blue-500 dark:bg-blue-400"
                      }`}
                      style={{ width: `${porcentajeUsado}%` }}
                    />
                  </div>
                </div>

                {/* Saldo total pendiente */}
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Saldo Total Pendiente
                  </span>
                  <span className="text-base font-bold text-gray-800 dark:text-white/90">
                    {lps(saldoPendienteTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerta si excede límite */}
            {excedeLimite && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                <svg
                  className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                    Límite de Crédito Alcanzado
                  </p>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                    Este empleado ha consumido el 100% de su capacidad de
                    endeudamiento mensual.
                  </p>
                </div>
              </div>
            )}

            {/* Tabla de créditos activos */}
            {creditosActivos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Créditos Activos
                </h3>
                <DataTable
                  columns={columnasCreditosDetalle}
                  data={creditosActivos}
                  loading={loading}
                >
                  <DataTable.Table emptyMessage="Sin créditos activos." />
                  <DataTable.Pagination />
                </DataTable>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ───────────────────────────────────────────────
export default function EmpleadosOficialCredito() {
  const [empleados, setEmpleados] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [porcentajeLimite, setPorcentajeLimite] = useState(null);
  const [loading, setLoading] = useState(true);

  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [creditosEmpleado, setCreditosEmpleado] = useState([]);
  const [loadingCreditos, setLoadingCreditos] = useState(false);

  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const { isOpen, openModal, closeModal } = useModal();

  // ── Fetch empleados y departamentos ──────────────────────────────
  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [snapEmpleados, snapDeps, snapConfig] = await Promise.all([
        getDocs(query(collection(db, "empleados"), orderBy("nombres", "asc"))),
        getDocs(collection(db, "departamentos")),
        getDoc(doc(db, "configuracion", "creditoComisariato")),
      ]);
      setEmpleados(snapEmpleados.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDepartamentos(snapDeps.docs.map((d) => ({ id: d.id, ...d.data() })));
      if (snapConfig.exists()) {
        setPorcentajeLimite(snapConfig.data().porcentajeLimite ?? null);
      }
    } catch (err) {
      console.error("Error al cargar empleados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  // ── Abrir modal y cargar créditos del empleado ────────────────────
  const handleVerPerfil = async (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setCreditosEmpleado([]);
    setLoadingCreditos(true);
    openModal();
    try {
      const empleadoIdManual = String(
        empleado.empleadoId ?? empleado.codigoEmpleado ?? "",
      ).trim();

      if (!empleadoIdManual) {
        setCreditosEmpleado([]);
        return;
      }

      const snap = await getDocs(
        query(
          collection(db, "creditos"),
          where("empleadoId", "==", empleadoIdManual),
        ),
      );

      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const fa =
            a.fechaAutoriza?.toMillis?.() ?? a.fechaRegistro?.toMillis?.() ?? 0;
          const fb =
            b.fechaAutoriza?.toMillis?.() ?? b.fechaRegistro?.toMillis?.() ?? 0;
          return fb - fa;
        });

      setCreditosEmpleado(docs);
    } catch (err) {
      console.error("Error al cargar créditos:", err);
    } finally {
      setLoadingCreditos(false);
    }
  };

  // ── Métricas ──────────────────────────────────────────────────────
  const { totalActivos, totalInactivos, totalDepartamentos } = useMemo(() => {
    return {
      totalActivos: empleados.filter((e) => getEstadoEmpleado(e) === "Activo")
        .length,
      totalInactivos: empleados.filter(
        (e) => getEstadoEmpleado(e) === "Inactivo",
      ).length,
      totalDepartamentos: new Set(empleados.map((e) => e.departamentoId)).size,
    };
  }, [empleados]);

  // ── Filtros ───────────────────────────────────────────────────────
  const empleadosFiltrados = useMemo(() => {
    return empleados.filter((e) => {
      const porDep = filtroDepartamento
        ? e.departamentoId === filtroDepartamento
        : true;
      const porEstado = filtroEstado
        ? getEstadoEmpleado(e) === filtroEstado
        : true;
      return porDep && porEstado;
    });
  }, [empleados, filtroDepartamento, filtroEstado]);

  // ── Columnas ──────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        accessorFn: (row) => `${row.nombres} ${row.apellidos}`,
        id: "nombreCompleto",
        header: "Nombre",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: "departamentoNombre",
        header: "Departamento",
        cell: (info) => (
          <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "salario",
        header: "Salario",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "fechaRegistro",
        header: "Fecha Registro",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="block text-gray-700 text-theme-sm dark:text-gray-300">
              {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        id: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const estado = getEstadoEmpleado(row.original);
          return (
            <Badge size="sm" color={estadoEmpleadoColor[estado] ?? "warning"}>
              {estado}
            </Badge>
          );
        },
      },
      {
        id: "acciones",
        header: "Acción",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            onClick={() => handleVerPerfil(row.original)}
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition text-theme-sm font-medium"
          >
            <EyeIcon className="w-4 h-4" />
            Ver Perfil
          </button>
        ),
      },
    ],
    [],
  );

  // ── JSX ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Empleados
      </h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={empleados.length}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Activos"
          value={totalActivos}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Inactivos"
          value={totalInactivos}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {/* Tabla */}
      <DataTable columns={columns} data={empleadosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por nombre o apellido...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroDepartamento}
              onChange={(e) => setFiltroDepartamento(e.target.value)}
              className="w-full sm:w-52 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Departamento
              </option>
              {departamentos.map((dep) => (
                <option
                  key={dep.id}
                  value={dep.id}
                  className="bg-white text-gray-900"
                >
                  {dep.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-40 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Estado
              </option>
              <option value="Activo" className="bg-white text-gray-900">
                Activo
              </option>
              <option value="Inactivo" className="bg-white text-gray-900">
                Inactivo
              </option>
            </select>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* Modal de perfil */}
      <PerfilEmpleadoModal
        isOpen={isOpen}
        onClose={closeModal}
        empleado={empleadoSeleccionado}
        creditos={creditosEmpleado}
        loading={loadingCreditos}
        porcentajeLimite={porcentajeLimite}
      />
    </div>
  );
}
