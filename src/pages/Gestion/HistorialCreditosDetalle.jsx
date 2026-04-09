import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import PageShell from "../../components/common/PageShell";
import DataTable from "../../components/ui/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import { ChevronLeftIcon } from "../../icons";
import { db } from "../../firebase/firebase";
import { lps, estadoCreditoColor } from "./columns/historialCreditoColumns";
const formatFecha = (valor) => {
  if (!valor) return "---";
  if (typeof valor?.toDate === "function") {
    return valor.toDate()?.toLocaleDateString("es-HN") ?? "---";
  }
  if (valor instanceof Date) {
    return valor.toLocaleDateString("es-HN");
  }
  const seconds = valor?.seconds ?? valor?._seconds;
  if (typeof seconds === "number") {
    return new Date(seconds * 1000).toLocaleDateString("es-HN");
  }
  return "---";
};
export default function HistorialCreditosDetalle() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const credito = state?.credito ?? null;
  const [cuotas, setCuotas] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);
  useEffect(() => {
    if (!credito?.id) return;
    const fetchCuotas = async () => {
      setLoadingCuotas(true);
      try {
        const q = query(
          collection(db, "cuotas"),
          where("creditoId", "==", credito.id),
        );
        const snap = await getDocs(q);
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort(
            (a, b) => Number(a.numeroCuota ?? 0) - Number(b.numeroCuota ?? 0),
          );
        setCuotas(docs);
      } catch (err) {
        console.error("Error al cargar cuotas del crédito:", err);
      } finally {
        setLoadingCuotas(false);
      }
    };
    fetchCuotas();
  }, [credito?.id]);
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
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {formatFecha(info.getValue())}
          </span>
        ),
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
  if (!credito) {
    return (
      <PageShell
        breadcrumbCurrent="Detalle"
        homeLabel="Historial de Créditos"
        homePath="/historial-creditos"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró información del crédito.
        </div>
      </PageShell>
    );
  }
  const fin = credito.datosFinancierosHistoricos ?? {};
  const cuotasPagadas = Number(credito.cuotasPagadas ?? 0);
  const plazoCuotas = Number(fin.plazoCuotas ?? 0);
  const estadoCredito = credito.estadoCredito ?? "Activo";
  const esActivo = String(estadoCredito).toLowerCase() === "activo";
  const cantidadSolicitada = Math.max(
    1,
    Number(credito.cantidad ?? credito.cantidadSolicitada ?? 1),
  );
  const porcentajeAvance =
    plazoCuotas > 0 ? Math.min(100, (cuotasPagadas / plazoCuotas) * 100) : 0;
  const nombreEmpleado =
    `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim() ||
    "Empleado";
  return (
    <PageShell
      breadcrumbItems={["Detalle", credito.productoNombre ?? "Crédito"]}
      homeLabel="Historial de Créditos"
      homePath="/historial-creditos"
      contentClassName="space-y-5"
    >
      <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 sm:p-6 bg-white dark:bg-gray-800 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <button
            type="button"
            onClick={() => navigate("/historial-creditos")}
            className="inline-flex items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Regresar a historial de créditos
          </button>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {esActivo ? "Progreso del Crédito" : "Historial del Crédito"}
          </p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {nombreEmpleado}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {credito.productoNombre ?? "---"}
            </p>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Cantidad solicitada:
              <span className="ml-1 font-semibold text-gray-700 dark:text-gray-200">
                {cantidadSolicitada}
              </span>
            </span>
            <Badge
              size="sm"
              color={estadoCreditoColor[estadoCredito] ?? "warning"}
            >
              {estadoCredito}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total Crédito
            </p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {lps(fin.totalCredito)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cuota Mensual
            </p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {lps(fin.cuotaMensual)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Saldo Pendiente
            </p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {lps(credito.saldoPendiente)}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Progreso
            </p>
            <p className="text-base font-bold text-gray-800 dark:text-white/90">
              {cuotasPagadas} / {plazoCuotas} cuotas
            </p>
          </div>
        </div>
        {plazoCuotas > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Avance
              </span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {Math.round(porcentajeAvance)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all"
                style={{ width: `${porcentajeAvance}%` }}
              />
            </div>
          </div>
        )}
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Cuotas Cobradas
            </p>
          </div>
          <div className="p-3">
            <DataTable
              columns={columnasCuotas}
              data={cuotas}
              loading={loadingCuotas}
            >
              <DataTable.Table emptyMessage="Este crédito aún no tiene cuotas cobradas." />
              <DataTable.Pagination />
            </DataTable>
          </div>
        </div>
      </div>
    </PageShell>
  );
}