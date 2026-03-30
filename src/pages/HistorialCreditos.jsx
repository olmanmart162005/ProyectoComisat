import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import MetricCard from "../components/common/MetricCard";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import { BoxIconLine, CheckCircleIcon, GroupIcon, EyeIcon } from "../icons";

// ── Helpers ────────────────────────────────────────────────────────
const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

const MESES = [
  { valor: "01", etiqueta: "Enero" },
  { valor: "02", etiqueta: "Febrero" },
  { valor: "03", etiqueta: "Marzo" },
  { valor: "04", etiqueta: "Abril" },
  { valor: "05", etiqueta: "Mayo" },
  { valor: "06", etiqueta: "Junio" },
  { valor: "07", etiqueta: "Julio" },
  { valor: "08", etiqueta: "Agosto" },
  { valor: "09", etiqueta: "Septiembre" },
  { valor: "10", etiqueta: "Octubre" },
  { valor: "11", etiqueta: "Noviembre" },
  { valor: "12", etiqueta: "Diciembre" },
];

// Genera años desde 2020 hasta el año actual
const generarAnios = () => {
  const anioActual = new Date().getFullYear();
  const anios = [];
  for (let y = anioActual; y >= 2020; y--) {
    anios.push(String(y));
  }
  return anios;
};

const estadoCreditoColor = {
  Activo: "success",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};

// ── Modal de Cuotas ────────────────────────────────────────────────
function CuotasModal({ isOpen, onClose, credito, cuotas, loading }) {
  if (!credito) return null;

  const fin = credito.datosFinancierosHistoricos ?? {};
  const cuotasPagadas = Number(credito.cuotasPagadas ?? 0);
  const plazoCuotas = Number(fin.plazoCuotas ?? 0);
  const estadoCredito = credito.estadoCredito ?? "Activo";
  const esActivo = String(estadoCredito).toLowerCase() === "activo";

  const columnasCuotas = useMemo(
    () => [
      {
        id: "numeroCuota",
        header: "Nº",
        cell: ({ row }) => (
          <span className="block font-bold text-gray-800 text-theme-sm dark:text-white/90">
            {row.original.numeroCuota ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "montoCuota",
        header: "Monto",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "saldoPendiente",
        header: "Saldo Tras Pago",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "fechaCobro",
        header: "Fecha de Cobro",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
      },
      {
        accessorKey: "mesCobro",
        header: "Mes",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "registradoPor",
        header: "Registrado Por",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "---"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="flex flex-col max-h-[85vh] overflow-hidden rounded-xl">

        {/* Header fijo */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {esActivo ? "Progreso del Crédito" : "Historial del Crédito"}
            </p>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white/90 mt-0.5 truncate">
              {`${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim()}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {credito.productoNombre ?? "---"}
              </p>
              <Badge size="sm" color={estadoCreditoColor[estadoCredito] ?? "warning"}>
                {estadoCredito}
              </Badge>
            </div>
          </div>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Resumen financiero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Crédito</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(fin.totalCredito)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Cuota Mensual</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(fin.cuotaMensual)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Saldo Pendiente</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{lps(credito.saldoPendiente)}</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Progreso</p>
              <p className="text-base font-bold text-gray-800 dark:text-white/90">{cuotasPagadas} / {plazoCuotas} cuotas</p>
            </div>
          </div>

          {/* Barra de progreso */}
          {plazoCuotas > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avance</span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {Math.round((cuotasPagadas / plazoCuotas) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                  style={{ width: `${Math.min(100, (cuotasPagadas / plazoCuotas) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tabla de cuotas */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
              Cuotas Cobradas
            </h3>
            <DataTable columns={columnasCuotas} data={cuotas} loading={loading}>
              <DataTable.Table emptyMessage="Este crédito aún no tiene cuotas cobradas." />
              <DataTable.Pagination />
            </DataTable>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Componente principal ───────────────────────────────────────────
export default function HistorialCreditos() {
  const now = new Date();

  const [cuotas, setCuotas] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selectores independientes
  const [anioFiltro, setAnioFiltro] = useState(String(now.getFullYear()));
  const [mesFiltro, setMesFiltro] = useState(
    String(now.getMonth() + 1).padStart(2, "0"),
  );

  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [cuotasDelCredito, setCuotasDelCredito] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const anios = useMemo(() => generarAnios(), []);

  // "YYYY-MM" para Firestore
  const mesKey = `${anioFiltro}-${mesFiltro}`;

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchDatos = async (key) => {
    setLoading(true);
    try {
      const [snapCuotas, snapCreditos] = await Promise.all([
        getDocs(query(collection(db, "cuotas"), where("mesCobro", "==", key))),
        getDocs(query(collection(db, "creditos"), where("mesCobro", "==", key))),
      ]);
      setCuotas(snapCuotas.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCreditos(snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos(mesKey);
  }, [mesKey]);

  // ── Abrir modal ──────────────────────────────────────────────────
  const handleVerCuotas = async (credito) => {
    setCreditoSeleccionado(credito);
    setCuotasDelCredito([]);
    setLoadingCuotas(true);
    openModal();
    try {
      const q = query(
        collection(db, "cuotas"),
        where("creditoId", "==", credito.id),
      );
      const snap = await getDocs(q);
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.numeroCuota ?? 0) - Number(b.numeroCuota ?? 0));
      setCuotasDelCredito(docs);
    } catch (err) {
      console.error("Error al cargar cuotas del crédito:", err);
    } finally {
      setLoadingCuotas(false);
    }
  };

  // ── Métricas ─────────────────────────────────────────────────────
  const { totalCuotas, montoTotal, empleadosUnicos, creditosPagados } =
    useMemo(() => {
      const monto = cuotas.reduce((acc, c) => acc + Number(c.montoCuota ?? 0), 0);
      const empleados = new Set(cuotas.map((c) => c.empleadoId));
      const pagados = creditos.filter(
        (c) => String(c.estadoCredito ?? "").toLowerCase() === "pagado",
      ).length;
      return { totalCuotas: cuotas.length, montoTotal: monto, empleadosUnicos: empleados.size, creditosPagados: pagados };
    }, [cuotas, creditos]);

  // ── Columnas ─────────────────────────────────────────────────────
  const columnasCreditos = useMemo(
    () => [
      {
        id: "empleado",
        header: "Empleado",
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {`${row.original.empleadoNombres ?? ""} ${row.original.empleadoApellidos ?? ""}`.trim()}
          </span>
        ),
      },
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
        id: "progreso",
        header: "Progreso",
        cell: ({ row }) => {
          const pagadas = Number(row.original.cuotasPagadas ?? 0);
          const total = Number(row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0);
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {pagadas} de {total} cuotas
            </span>
          );
        },
      },
      {
        id: "saldo",
        header: "Saldo Pendiente",
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.saldoPendiente)}
          </span>
        ),
      },
      {
        accessorKey: "fechaAutoriza",
        header: "Fecha Autorización",
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {val?.toDate?.()?.toLocaleDateString("es-HN") ?? "---"}
            </span>
          );
        },
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
      {
        id: "acciones",
        header: "Acción",
        enableSorting: false,
        cell: ({ row }) => {
          const estadoCredito = String(row.original.estadoCredito ?? "activo").toLowerCase();
          const esActivo = estadoCredito === "activo";
          return (
            <button
              onClick={() => handleVerCuotas(row.original)}
              className={`inline-flex items-center gap-1.5 transition text-theme-sm font-medium ${
                esActivo
                  ? "text-blue-600 hover:text-blue-800"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              <EyeIcon className="w-4 h-4" />
              {esActivo ? "Ver Progreso" : "Ver Historial"}
            </button>
          );
        },
      },
    ],
    [],
  );

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Historial de Créditos
      </h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6">
        <MetricCard
          title="Cuotas Cobradas"
          value={totalCuotas}
          icon={<BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto Cobrado"
          value={lps(montoTotal)}
          icon={<CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />}
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados"
          value={empleadosUnicos}
          icon={<GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />}
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Créditos Liquidados"
          value={creditosPagados}
          icon={<CheckCircleIcon className="text-emerald-600 size-6 dark:text-emerald-400" />}
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
      </div>



      {/* Tabla — filtros mes y año dentro del toolbar */}
      <div className="space-y-3">
        {creditos.length > 0 && (
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Créditos del Período
            </h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
              {creditos.length}
            </span>
          </div>
        )}
        <DataTable columns={columnasCreditos} data={creditos} loading={loading}>
          <DataTable.Toolbar searchPlaceholder="Buscar crédito por empleado, artículo o saldo...">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
              <select
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
                className="w-full sm:w-36 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
              >
                {MESES.map((m) => (
                  <option key={m.valor} value={m.valor} className="bg-white text-gray-900">
                    {m.etiqueta}
                  </option>
                ))}
              </select>
              <select
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value)}
                className="w-full sm:w-28 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
              >
                {anios.map((a) => (
                  <option key={a} value={a} className="bg-white text-gray-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </DataTable.Toolbar>
          <DataTable.Table emptyMessage="Sin créditos para el período seleccionado." />
          <DataTable.Pagination />
        </DataTable>
      </div>

      {/* Modal de cuotas */}
      <CuotasModal
        isOpen={isOpen}
        onClose={closeModal}
        credito={creditoSeleccionado}
        cuotas={cuotasDelCredito}
        loading={loadingCuotas}
      />
    </div>
  );
}