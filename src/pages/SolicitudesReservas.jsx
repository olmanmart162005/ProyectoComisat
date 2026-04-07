// Columnas para exportar (formato plano, sin celdas personalizadas)
const COLUMNAS_EXPORT_SOLICITUDES = [
  { key: "empleadoNombres", header: "Empleado", type: "text" },
  { key: "empleadoApellidos", header: "Apellidos", type: "text" },
  { key: "productoNombre", header: "Artículo", type: "text" },
  {
    key: "totalCredito",
    header: "Total Crédito (L.)",
    type: "currency",
    getValue: (row) => row.datosFinancierosHistoricos?.totalCredito ?? 0,
  },
  {
    key: "plazoCuotas",
    header: "Plazo (meses)",
    type: "number",
    getValue: (row) => row.datosFinancierosHistoricos?.plazoCuotas ?? 0,
  },
  {
    key: "cuotaMensual",
    header: "Cuota Mensual (L.)",
    type: "currency",
    getValue: (row) => row.datosFinancierosHistoricos?.cuotaMensual ?? 0,
  },
  { key: "fechaRegistro", header: "Solicitado", type: "date" },
  { key: "estado", header: "Estado", type: "text" },
];
import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";


import { useAuth } from "../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../hooks/useNombreEmpleadoActual";
import { registrarBitacora } from "../services/bitacora";
import ExportButtons from "../layout/Exportbuttons";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import MetricCard from "../components/common/MetricCard";
import { CheckCircleIcon, CloseIcon, BoxIconLine, EyeIcon } from "../icons";

// ── Helpers ────────────────────────────────────────────────────────
const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;
const estadoColor = {
  Aprobado: "success",
  Activo: "success",
  Rechazado: "error",
  Pendiente: "warning",
};

// ── Modal de Detalle ───────────────────────────────────────────────
function CreditReviewModal({
  isOpen,
  onClose,
  solicitud,
  onDecision,
  procesando,
  resumenEmpleado,
  historialPrevio,
  loadingHistorial,
}) {
  if (!solicitud) return null;

  const fin = solicitud.datosFinancierosHistoricos ?? {};
  const limite =
    (fin.salarioNetoAlMomento ?? 0) * (fin.porcentajeLimiteAplicado ?? 0);
  const creditoUtilizado = resumenEmpleado?.cuotaMensualActiva ?? 0;
  const disponible = Math.max(0, limite - creditoUtilizado);
  const excedeLimite = (fin.cuotaMensual ?? 0) > disponible;
  const limiteConsumido = creditoUtilizado >= limite;
  const isPendiente = solicitud.estado === "Pendiente";
  const mostrarAuditoria = ["Aprobado", "Rechazado"].includes(solicitud.estado);

  const historialColumns = useMemo(
    () => [
      {
        accessorKey: "fechaAutoriza",
        header: "Fecha",
        cell: (info) => {
          const fecha = info.getValue();
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
            <Badge size="sm" color={estadoColor[val] ?? "warning"}>
              {val ?? "---"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="flex h-full max-h-[90vh] overflow-hidden rounded-xl">
        {/* ── Panel izquierdo — Historial placeholder ── */}
        <aside className="hidden md:flex flex-col w-95 shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900 rounded-l-xl overflow-hidden">
          <div className="px-4 pt-5 pb-3 border-b border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Perfil del Empleado
            </p>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mt-1">
              Historial de Créditos
            </h3>
          </div>
          <div className="flex-1 p-3 overflow-hidden">
            <DataTable
              columns={historialColumns}
              data={historialPrevio}
              loading={loadingHistorial}
            >
              <DataTable.Table emptyMessage="Sin historial previo" />
              <div className="[&>div]:mt-2 [&>div]:gap-2 [&>div>div:first-child]:hidden [&>div>div:last-child>span]:hidden [&_button]:px-2 [&_button]:py-1 [&_button]:text-xs">
                <DataTable.Pagination />
              </div>
            </DataTable>
          </div>
          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              Préstamos Activos
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {resumenEmpleado?.cantidadActivos ?? 0}
            </span>
          </div>
        </aside>

        {/* ── Panel derecho ── */}
        <div className="flex flex-col flex-1 overflow-hidden rounded-r-xl bg-white dark:bg-gray-800">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Nombre */}
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {solicitud.empleadoNombres} {solicitud.empleadoApellidos}
            </h2>

            {mostrarAuditoria && (
              <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Usuario que autorizó
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                      {solicitud.empleadoAutoriza ?? "Sin registro"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                      Fecha de autorización
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90 mt-1">
                      {solicitud.fechaAutoriza
                        ?.toDate?.()
                        ?.toLocaleString("es-HN") ?? "Sin registro"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Producto */}
            <div className="flex items-center gap-5 p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-sm">
              <div className="relative w-24 h-24 rounded-xl bg-white p-2 border border-gray-100 dark:border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {solicitud.productoImgUrl ? (
                  <img
                    src={solicitud.productoImgUrl}
                    alt={solicitud.productoNombre}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400 font-medium">N/A</span>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 mb-1">
                  Detalle de Compra
                </span>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight mb-1">
                  {solicitud.productoNombre}
                </h3>

                <p className="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight">
                  <span className="text-sm font-medium mr-1 text-gray-500"></span>
                  {lps(fin.totalCredito)}
                </p>
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
                      value: lps(fin.salarioNetoAlMomento),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: "Límite Aplicado",
                      value: lps(limite),
                      color: "text-gray-800 dark:text-white/90",
                    },
                    {
                      label: "Crédito Utilizado",
                      value: lps(creditoUtilizado),
                      color: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                      label: "Disponible",
                      value: lps(disponible),
                      color: "text-green-700 dark:text-green-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 min-h-4">
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
              </div>
            </div>

            {/* Alerta — solo si excede límite */}
            {isPendiente && excedeLimite && (
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
                    Estado de Alerta
                  </p>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">
                    La cuota mensual solicitada excede el disponible mensual del
                    cliente.
                  </p>
                </div>
              </div>
            )}

            {/* Condiciones de financiamiento */}
            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Condiciones del Financiamiento
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Plazo Elegido
                    </p>
                    <p className="text-xl leading-none font-bold text-gray-800 dark:text-white/90">
                      {fin.plazoCuotas} Meses
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Cuota Mensual
                    </p>
                    <p className="text-xl leading-none font-bold text-gray-800 dark:text-white/90">
                      {lps(fin.cuotaMensual)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer acciones */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex gap-3 bg-white dark:bg-gray-800">
            <button
              onClick={() => onDecision("Aprobado")}
              disabled={
                procesando || !isPendiente || limiteConsumido || excedeLimite
              }
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition
                bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white
                disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {procesando ? "Procesando..." : "Aprobar Crédito"}
            </button>
            <button
              onClick={() => onDecision("Rechazado")}
              disabled={procesando || !isPendiente}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-md font-bold text-sm transition
                bg-red-600 hover:bg-red-700 text-white
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Rechazar Solicitud
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ───────────────────────────────────────────────
export default function SolicitudesCredito() {
  const nombreEmpleado = useNombreEmpleadoActual();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [filtroEstadoSolicitud, setFiltroEstadoSolicitud] = useState("");
  const [historialPrevioSeleccionado, setHistorialPrevioSeleccionado] =
    useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();

  // Métricas
  const totalPendientes = solicitudes.filter(
    (s) => s.estado === "Pendiente",
  ).length;
  const totalAprobados = solicitudes.filter(
    (s) => s.estado === "Aprobado",
  ).length;
  const montoEnRiesgo = solicitudes
    .filter((s) => s.estado === "Pendiente")
    .reduce(
      (acc, s) => acc + (s.datosFinancierosHistoricos?.totalCredito ?? 0),
      0,
    );

  const totalRechazados = solicitudes.filter(
    (s) => s.estado === "Rechazado",
  ).length;

  const getEmpleadoKey = (s) => {
    if (!s) return "";
    return String(
      s.empleadoId ??
        s.empleadoUid ??
        s.idEmpleado ??
        `${s.empleadoNombres ?? ""}|${s.empleadoaApellidos ?? ""}`,
    )
      .trim()
      .toLowerCase();
  };

  const resumenEmpleadoSeleccionado = useMemo(() => {
    if (!solicitudSeleccionada) {
      return { cantidadActivos: 0, cuotaMensualActiva: 0 };
    }

    const empleadoKey = getEmpleadoKey(solicitudSeleccionada);
    const creditosActivos = solicitudes.filter((s) => {
      const mismoEmpleado = getEmpleadoKey(s) === empleadoKey;
      const aprobado = s.estado === "Aprobado";
      const estadoCredito = String(s.estadoCredito ?? "").toLowerCase();
      const sigueActivo = !["pagado", "cancelado", "finalizado"].includes(
        estadoCredito,
      );
      return mismoEmpleado && aprobado && sigueActivo;
    });

    const cuotaMensualActiva = creditosActivos.reduce(
      (acc, s) =>
        acc +
        Number(
          s.datosFinancierosHistoricos?.cuotaMensual ?? s.cuotaMensual ?? 0,
        ),
      0,
    );

    return {
      cantidadActivos: creditosActivos.length,
      cuotaMensualActiva,
    };
  }, [solicitudSeleccionada, solicitudes]);

  useEffect(() => {
    const cargarHistorialPrevio = async () => {
      if (!isOpen || !solicitudSeleccionada) {
        setHistorialPrevioSeleccionado([]);
        return;
      }

      const toMillis = (fecha) => {
        if (!fecha) return 0;
        if (typeof fecha?.toMillis === "function") return fecha.toMillis();
        const parsed = new Date(fecha).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const estadosHistorial = ["Aprobado", "Rechazado"];

      setLoadingHistorial(true);
      try {
        const empleadoId = solicitudSeleccionada.empleadoId;

        if (empleadoId) {
          const q = query(
            collection(db, "creditos"),
            where("empleadoId", "==", empleadoId),
          );
          const snap = await getDocs(q);
          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          const historial = docs
            .filter((s) => estadosHistorial.includes(s.estado))
            .sort((a, b) => {
              const fechaB = toMillis(b.fechaAutoriza ?? b.fechaRegistro);
              const fechaA = toMillis(a.fechaAutoriza ?? a.fechaRegistro);
              return fechaB - fechaA;
            });

          const solicitudActualEsHistorial = estadosHistorial.includes(
            solicitudSeleccionada.estado,
          );
          const yaExisteActual = historial.some(
            (s) => s.id === solicitudSeleccionada.id,
          );

          if (solicitudActualEsHistorial && !yaExisteActual) {
            historial.unshift(solicitudSeleccionada);
          }

          setHistorialPrevioSeleccionado(historial);
          return;
        }

        const empleadoKey = getEmpleadoKey(solicitudSeleccionada);
        const historialFallback = solicitudes
          .filter((s) => getEmpleadoKey(s) === empleadoKey)
          .filter((s) => estadosHistorial.includes(s.estado))
          .sort((a, b) => {
            const fechaB = toMillis(b.fechaAutoriza ?? b.fechaRegistro);
            const fechaA = toMillis(a.fechaAutoriza ?? a.fechaRegistro);
            return fechaB - fechaA;
          });

        setHistorialPrevioSeleccionado(historialFallback);
      } catch (error) {
        console.error("Error al cargar historial previo:", error);
        setHistorialPrevioSeleccionado([]);
      } finally {
        setLoadingHistorial(false);
      }
    };

    cargarHistorialPrevio();
  }, [isOpen, solicitudSeleccionada, solicitudes]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "creditos"),
        orderBy("fechaRegistro", "desc"),
      );
      const snap = await getDocs(q);
      setSolicitudes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  const handleDecision = async (nuevoEstado) => {
    if (!solicitudSeleccionada) return;
    setProcesando(true);
    try {
      const fechaLocal = Timestamp.now();
      await updateDoc(doc(db, "creditos", solicitudSeleccionada.id), {
        estado: nuevoEstado,
        ...(nuevoEstado !== "Pendiente" && {
          fechaAutoriza: serverTimestamp(),
          empleadoAutoriza: user?.email ?? "desconocido",
        }),
        ...(nuevoEstado === "Aprobado" && {
          cuotasPagadas: 0,
          saldoPendiente:
            solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0,
          estadoCredito: "Activo",
        }),
      });

      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudSeleccionada.id
            ? {
                ...s,
                estado: nuevoEstado,
                ...(nuevoEstado !== "Pendiente" && {
                  fechaAutoriza: fechaLocal,
                  empleadoAutoriza: user?.email ?? "desconocido",
                }),
                ...(nuevoEstado === "Aprobado" && {
                  cuotasPagadas: 0,
                  saldoPendiente:
                    solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0,
                  estadoCredito: "Activo",
                }),
              }
            : s,
        ),
      );

      setSolicitudSeleccionada((prev) =>
        prev
          ? {
              ...prev,
              estado: nuevoEstado,
              ...(nuevoEstado !== "Pendiente" && {
                fechaAutoriza: fechaLocal,
                empleadoAutoriza: user?.email ?? "desconocido",
              }),
              ...(nuevoEstado === "Aprobado" && {
                cuotasPagadas: 0,
                saldoPendiente:
                  prev.datosFinancierosHistoricos?.totalCredito ?? 0,
                estadoCredito: "Activo",
              }),
            }
          : prev,
      );

      // ── Bitácora: registrar acción de aprobación/rechazo ──
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "creditos",
        accion: nuevoEstado === "Aprobado" ? "Aprobación" : "Rechazo",
        docId: solicitudSeleccionada.id,
        metadata: {
          detalle:
            nuevoEstado === "Aprobado"
              ? `Aprobó la solicitud de crédito para ${solicitudSeleccionada.empleadoNombres} ${solicitudSeleccionada.empleadoApellidos} por L. ${Number(solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`
              : `Rechazó la solicitud de crédito para ${solicitudSeleccionada.empleadoNombres} ${solicitudSeleccionada.empleadoApellidos} por L. ${Number(solicitudSeleccionada.datosFinancierosHistoricos?.totalCredito ?? 0).toLocaleString("es-HN")}`,
        },
      });

      alert(`Solicitud ${nuevoEstado} con éxito`);
      fetchSolicitudes();
    } catch (err) {
      console.error("Error al procesar:", err);
      alert("Error al procesar la solicitud");
    } finally {
      setProcesando(false);
    }
  };

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      if (!filtroEstadoSolicitud) return true;

      const estado = String(s.estado ?? "").toLowerCase();
      return estado === filtroEstadoSolicitud;
    });
  }, [solicitudes, filtroEstadoSolicitud]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "empleadoNombres",
        header: "Empleado",
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {row.original.empleadoNombres} {row.original.empleadoApellidos}
          </span>
        ),
      },
      {
        accessorKey: "productoNombre",
        header: "Artículo",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()}
          </span>
        ),
      },
      {
        id: "total",
        header: "Total Crédito",
        accessorFn: (row) =>
          Number(row.datosFinancierosHistoricos?.totalCredito ?? 0),
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.datosFinancierosHistoricos?.totalCredito)}
          </span>
        ),
      },
      {
        id: "plazo",
        header: "Plazo",
        accessorFn: (row) =>
          Number(row.datosFinancierosHistoricos?.plazoCuotas ?? 0),
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {row.original.datosFinancierosHistoricos?.plazoCuotas
              ? `${row.original.datosFinancierosHistoricos.plazoCuotas}`
              : "---"}
          </span>
        ),
      },
      {
        id: "cuota",
        header: "Cuota",
        accessorFn: (row) =>
          Number(row.datosFinancierosHistoricos?.cuotaMensual ?? 0),
        cell: ({ row }) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {lps(row.original.datosFinancierosHistoricos?.cuotaMensual)}
          </span>
        ),
      },
      {
        accessorKey: "fechaRegistro",
        header: "Solicitado",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue()?.toDate().toLocaleDateString("es-HN") ?? "---"}
          </span>
        ),
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge size="sm" color={estadoColor[val] ?? "warning"}>
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
          const estadoSolicitud = String(
            row.original.estado ?? "",
          ).toLowerCase();
          const esPendiente = estadoSolicitud === "pendiente";
          const textoAccion = esPendiente
            ? "Revisar Solicitud"
            : "Ver Historial";
          const colorAccion = esPendiente
            ? "text-blue-600 hover:text-blue-800"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200";

          return (
            <button
              onClick={() => {
                setSolicitudSeleccionada(row.original);
                openModal();
              }}
              className={`inline-flex items-center gap-1.5 transition text-theme-sm font-medium ${colorAccion}`}
            >
              <EyeIcon className="w-4 h-4" />
              {textoAccion}
            </button>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Solicitudes de Crédito
      </h2>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6">
        <MetricCard
          title="Pendientes Revisión"
          value={totalPendientes}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto por Aprobar"
          value={lps(montoEnRiesgo)}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Aprobados"
          value={totalAprobados}
          icon={
            <CloseIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Rechazados"
          value={totalRechazados}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={solicitudesFiltradas}
        loading={loading}
      >
        <DataTable.Toolbar searchPlaceholder="Buscar por empleado...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <select
              value={filtroEstadoSolicitud}
              onChange={(e) => setFiltroEstadoSolicitud(e.target.value)}
              className="w-full sm:w-56 p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
            >
              <option value="" className="bg-white text-gray-900">
                Estado
              </option>
              <option value="pendiente" className="bg-white text-gray-900">
                Pendiente
              </option>
              <option value="aprobado" className="bg-white text-gray-900">
                Aprobado
              </option>
              <option value="rechazado" className="bg-white text-gray-900">
                Rechazado
              </option>
            </select>
          </div>
          <ExportButtons
          rows={solicitudesFiltradas}
          columns={COLUMNAS_EXPORT_SOLICITUDES}
          filename={"Solicitudes de Crédito " + new Date().toLocaleDateString("es-HN")}
          meta={{
            empresa: "Comisariato San Jose",
            usuario: nombreEmpleado || "Sistema",
            extra: filtroEstadoSolicitud
              ? `Estado: ${filtroEstadoSolicitud}`
              : "Listado Completo",
          }}
          pdfOptions={{ title: "Solicitudes de Crédito", subtitle: new Date().toLocaleDateString("es-HN") }}
          onExport={async (formato) => {
            await registrarBitacora({
              usuario: user?.email ?? "desconocido",
              nombre: nombreEmpleado || user?.email || "desconocido",
              coleccion: "creditos",
              accion: "exportar",
              metadata: {
                formato,
                totalRegistros: solicitudesFiltradas.length,
                filtros: filtroEstadoSolicitud ? `Estado: ${filtroEstadoSolicitud}` : "",
              },
            });
          }}
        />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      {/* Modal */}
      <CreditReviewModal
        isOpen={isOpen}
        onClose={closeModal}
        solicitud={solicitudSeleccionada}
        resumenEmpleado={resumenEmpleadoSeleccionado}
        historialPrevio={historialPrevioSeleccionado}
        loadingHistorial={loadingHistorial}
        onDecision={handleDecision}
        procesando={procesando}
      />
    </div>
  );
}
