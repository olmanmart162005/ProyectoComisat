import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import { useAuth } from "../auth/AuthProvider";
import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import MetricCard from "../components/common/MetricCard";
import { CheckCircleIcon, BoxIconLine, GroupIcon } from "../icons";
import ExportButtons from "../layout/Exportbuttons";
import { registrarBitacora } from "../services/bitacora";

// ── Helpers ────────────────────────────────────────────────────────
const lps = (n) => `L. ${Number(n ?? 0).toLocaleString("es-HN")}`;

const getMesActual = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const ESTADOS_CERRADOS = ["pagado", "cancelado", "finalizado"];

// Columnas del reporte de exportación — definidas fuera del componente
// para que no se recreen en cada render.
const COLUMNAS_EXPORT_CUOTAS = [
  { key: "empleado",       header: "Empleado",           type: "text"     },
  { key: "productoNombre", header: "Artículo",            type: "text"     },
  { key: "numeroCuota",    header: "Cuota",               type: "text"     },
  { key: "montoCuota",     header: "Monto Cobrado (L.)",  type: "currency" },
  { key: "saldoTrasPago",  header: "Saldo Restante (L.)", type: "currency" },
  { key: "mesCobro",       header: "Mes de Cobro",        type: "text"     },
];

// ── Componente principal ───────────────────────────────────────────
export default function PagosMensuales() {
  const { user } = useAuth();

  const [creditosPendientes, setCreditosPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [registradoPor, setRegistradoPor] = useState("");

  // Snapshot de las cuotas procesadas para el reporte de exportación.
  // Se guarda antes del re-fetch que vacía creditosPendientes.
  const [cuotasCobradasParaExport, setCuotasCobradasParaExport] = useState([]);
  const [ultimoCobro, setUltimoCobro] = useState(null);

  const { isOpen, openModal, closeModal } = useModal();

  const mesActual = getMesActual();

  // ── 1. Resolver nombre completo del oficial ──────────────────────
  useEffect(() => {
    const resolverNombre = async () => {
      if (!user?.email) return;
      try {
        const qUsuario = query(
          collection(db, "usuarios"),
          where("correo", "==", user.email),
        );
        const snapUsuario = await getDocs(qUsuario);
        if (snapUsuario.empty) {
          setRegistradoPor(user.email);
          return;
        }

        const datosUsuario = snapUsuario.docs[0].data();
        const empleadoId = datosUsuario.empleadoId;

        if (!empleadoId) {
          setRegistradoPor(datosUsuario.nombre ?? user.email);
          return;
        }

        const qEmpleado = query(
          collection(db, "empleados"),
          where("__name__", "==", empleadoId),
        );
        const snapEmpleado = await getDocs(qEmpleado);
        if (snapEmpleado.empty) {
          setRegistradoPor(datosUsuario.nombre ?? user.email);
          return;
        }

        const emp = snapEmpleado.docs[0].data();
        const nombreCompleto =
          `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
        setRegistradoPor(nombreCompleto || user.email);
      } catch (err) {
        console.error("Error resolviendo nombre del oficial:", err);
        setRegistradoPor(user?.email ?? "desconocido");
      }
    };

    resolverNombre();
  }, [user]);

  // ── 2. Cargar créditos cobrables este mes ────────────────────────
  //
  // LÓGICA:
  // • Se trae la colección "cuotas" en una sola consulta y se agrupa
  //   por creditoId para obtener:
  //     _totalPagado       → suma de montoCuota registrada hasta ahora
  //     _cuotasPagadasReal → número de documentos de cuota registrados
  //
  // • Un crédito se excluye cuando _totalPagado >= totalCredito
  //   (liquidado), incluso si estadoCredito no lo refleja aún.
  // ─────────────────────────────────────────────────────────────────
  const fetchCreditosPendientes = async () => {
    setLoading(true);
    try {
      const snapCreditos = await getDocs(collection(db, "creditos"));
      const todos = snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() }));

      const snapCuotas = await getDocs(collection(db, "cuotas"));
      const pagosPorCredito = {};

      snapCuotas.docs.forEach((d) => {
        const { creditoId, montoCuota } = d.data();
        if (!creditoId) return;
        if (!pagosPorCredito[creditoId]) {
          pagosPorCredito[creditoId] = { total: 0, count: 0 };
        }
        pagosPorCredito[creditoId].total += Number(montoCuota ?? 0);
        pagosPorCredito[creditoId].count += 1;
      });

      const cobrables = todos
        .map((c) => ({
          ...c,
          _totalPagado: pagosPorCredito[c.id]?.total ?? 0,
          _cuotasPagadasReal: pagosPorCredito[c.id]?.count ?? 0,
        }))
        .filter((c) => {
          if (c.estado !== "Aprobado") return false;

          const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
          if (ESTADOS_CERRADOS.includes(estadoCredito)) return false;

          if (c.mesCobro === mesActual) return false;

          const totalCredito = Number(c.datosFinancierosHistoricos?.totalCredito ?? 0);
          const plazoCuotas = Number(c.datosFinancierosHistoricos?.plazoCuotas ?? 0);
          // Evitar cobros extra: si ya se pagaron todas las cuotas, no permitir más
          if (c._cuotasPagadasReal >= plazoCuotas && plazoCuotas > 0) return false;
          if (c._totalPagado >= totalCredito && totalCredito > 0) return false;

          return true;
        });

      setCreditosPendientes(cobrables);
    } catch (err) {
      console.error("Error al cargar créditos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditosPendientes();
  }, []);

  // ── 3. Métricas ──────────────────────────────────────────────────
  const { totalCuotas, montoTotal, empleadosUnicos } = useMemo(() => {
    const monto = creditosPendientes.reduce(
      (acc, c) =>
        acc + Number(c.datosFinancierosHistoricos?.cuotaMensual ?? 0),
      0,
    );
    const empleados = new Set(
      creditosPendientes.map((c) => c.empleadoId ?? c.empleadoNombres),
    );
    return {
      totalCuotas: creditosPendientes.length,
      montoTotal: monto,
      empleadosUnicos: empleados.size,
    };
  }, [creditosPendientes]);

  // ── 4. Realizar pagos (batch) ────────────────────────────────────
  const handleRealizarPagos = async () => {
    if (creditosPendientes.length === 0) return;
    setProcesando(true);
    closeModal();

    try {
      const batch = writeBatch(db);
      const fechaCobro = serverTimestamp();

      // Snapshot para el reporte — se construye ANTES del batch y del
      // re-fetch, para tener los datos aunque la lista se vacíe.
      const snapshotParaExport = creditosPendientes.map((credito) => {
        const fin = credito.datosFinancierosHistoricos ?? {};
        const cuotaMensual = Number(fin.cuotaMensual ?? 0);
        const totalCredito = Number(fin.totalCredito ?? 0);
        const totalPagadoReal = credito._totalPagado ?? 0;
        const numeroCuota = (credito._cuotasPagadasReal ?? 0) + 1;
        const saldoTrasPago = Math.max(
          0,
          totalCredito - totalPagadoReal - cuotaMensual,
        );
        return {
          empleado:
            `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim(),
          productoNombre: credito.productoNombre ?? "---",
          numeroCuota: `${numeroCuota} de ${fin.plazoCuotas ?? "?"}`,
          montoCuota: cuotaMensual,
          saldoTrasPago,
          mesCobro: mesActual,
        };
      });

      const montoTotalCobrado = snapshotParaExport.reduce(
        (acc, r) => acc + r.montoCuota,
        0,
      );

      for (const credito of creditosPendientes) {
        const fin = credito.datosFinancierosHistoricos ?? {};
        const cuotaMensual = Number(fin.cuotaMensual ?? 0);
        const totalCredito = Number(fin.totalCredito ?? 0);
        const plazoCuotas = Number(fin.plazoCuotas ?? 0);

        const cuotasPagadasReal = credito._cuotasPagadasReal ?? 0;
        const totalPagadoReal = credito._totalPagado ?? 0;

        // Validación extra: no crear cuota si ya se pagaron todas
        if (cuotasPagadasReal >= plazoCuotas && plazoCuotas > 0) {
          continue;
        }

        const numeroCuota = cuotasPagadasReal + 1;
        const nuevoTotalPagado = totalPagadoReal + cuotaMensual;
        const saldoPendiente = Math.max(0, totalCredito - nuevoTotalPagado);
        const esUltimaCuota = saldoPendiente <= 0 || numeroCuota === plazoCuotas;

        const nombreEmpleado =
          `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim();

        const cuotaRef = doc(collection(db, "cuotas"));
        batch.set(cuotaRef, {
          creditoId: credito.id,
          empleadoId: credito.empleadoId ?? "",
          empleadoNombre: nombreEmpleado,
          productoNombre: credito.productoNombre ?? "",
          numeroCuota,
          totalCuotas: plazoCuotas,
          montoCuota: cuotaMensual,
          saldoPendiente,
          mesCobro: mesActual,
          fechaCobro,
          registradoPor,
        });

        batch.update(doc(db, "creditos", credito.id), {
          cuotasPagadas: numeroCuota,
          saldoPendiente,
          mesCobro: mesActual,
          ...(esUltimaCuota && { estadoCredito: "Pagado" }),
        });
      }

      await batch.commit();

      // ── Bitácora ─────────────────────────────────────────────────
      // Se registra después del commit exitoso para garantizar que
      // el batch ya fue persistido antes de dejar constancia.
      await registrarBitacora({
        usuario: user.email,
        nombre: registradoPor,
        coleccion: "cuotas",
        accion: "cobro_mensual",
        metadata: {
          mesCobro: mesActual,
          totalCuotasRegistradas: snapshotParaExport.length,
          montoTotalCobrado,
          empleadosAfectados: new Set(
            creditosPendientes.map((c) => c.empleadoId ?? c.empleadoNombres),
          ).size,
        },
      });

      // ── Guardar snapshot para exportación ────────────────────────
      setCuotasCobradasParaExport(snapshotParaExport);
      setUltimoCobro({
        fecha: new Date().toLocaleDateString("es-HN"),
        totalCuotas: snapshotParaExport.length,
        montoTotal: montoTotalCobrado,
      });

      await fetchCreditosPendientes();
      alert("Pagos registrados con éxito");
    } catch (err) {
      console.error("Error al procesar pagos:", err);
      alert("Error al procesar los pagos. Intente de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  // ── 5. Columnas de la tabla ──────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        id: "empleado",
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
            {info.getValue() ?? "---"}
          </span>
        ),
      },
      {
        id: "cuota",
        header: "Cuota Mensual",
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
          const cuotasPagadas = row.original._cuotasPagadasReal ?? 0;
          const total = Number(
            row.original.datosFinancierosHistoricos?.plazoCuotas ?? 0,
          );
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              Cuota {cuotasPagadas + 1} de {total}
            </span>
          );
        },
      },
      {
        id: "saldo",
        header: "Saldo Tras Pago",
        cell: ({ row }) => {
          const fin = row.original.datosFinancierosHistoricos ?? {};
          const cuota = Number(fin.cuotaMensual ?? 0);
          const total = Number(fin.totalCredito ?? 0);
          const totalPagadoReal = row.original._totalPagado ?? 0;
          const saldo = Math.max(0, total - totalPagadoReal - cuota);
          return (
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {lps(saldo)}
            </span>
          );
        },
      },
      {
        id: "esUltima",
        header: "Estado",
        cell: ({ row }) => {
          const fin = row.original.datosFinancierosHistoricos ?? {};
          const cuota = Number(fin.cuotaMensual ?? 0);
          const total = Number(fin.totalCredito ?? 0);
          const totalPagadoReal = row.original._totalPagado ?? 0;
          const esUltima = totalPagadoReal + cuota >= total;
          return (
            <Badge size="sm" color={esUltima ? "success" : "warning"}>
              {esUltima ? "Última cuota" : "Al corriente"}
            </Badge>
          );
        },
      },
    ],
    [],
  );

  // ── JSX ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Pagos Mensuales
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Período:{" "}
            {new Date().toLocaleString("es-HN", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={openModal}
          disabled={procesando || creditosPendientes.length === 0 || loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2
            disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed"
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {procesando ? "Procesando..." : "Realizar Pagos"}
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Cuotas a Cobrar"
          value={totalCuotas}
          icon={
            <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Monto Total del Mes"
          value={lps(montoTotal)}
          icon={
            <CheckCircleIcon className="text-green-600 size-6 dark:text-green-400" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Empleados Involucrados"
          value={empleadosUnicos}
          icon={
            <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>

      {/* Aviso si ya se cobró este mes */}
      {!loading && creditosPendientes.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10">
          <svg
            className="w-5 h-5 text-green-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              Cobro completado
            </p>
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mt-0.5">
              Todos los créditos activos ya fueron cobrados este mes o no hay
              créditos pendientes.
            </p>
          </div>
        </div>
      )}

      {/* ── Banner de reporte — visible tras un cobro exitoso ─────── */}
      {cuotasCobradasParaExport.length > 0 && ultimoCobro && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">
                Reporte listo para descargar
              </p>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mt-0.5">
                {ultimoCobro.totalCuotas} cuotas cobradas ·{" "}
                {lps(ultimoCobro.montoTotal)} · {ultimoCobro.fecha}
              </p>
            </div>

            <ExportButtons
              rows={cuotasCobradasParaExport}
              columns={COLUMNAS_EXPORT_CUOTAS}
              filename={`Cuotas Cobradas ${mesActual}`}
              meta={{
                empresa: "Comisariato San Jose",
                usuario: registradoPor || user?.email || "Sistema",
                extra: `Período: ${mesActual} · Total cobrado: ${lps(ultimoCobro.montoTotal)}`,
              }}
              pdfOptions={{
                title: "Reporte de Cuotas Cobradas",
                subtitle: mesActual,
              }}
              onExport={(formato) =>
                registrarBitacora({
                  usuario: user.email,
                  nombre: registradoPor,
                  coleccion: "cuotas",
                  accion: "exportar",
                  metadata: {
                    formato,
                    mesCobro: mesActual,
                    totalRegistros: cuotasCobradasParaExport.length,
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={creditosPendientes}
        loading={loading}
      >
        <DataTable.Toolbar searchPlaceholder="Buscar por empleado o artículo..." />
        <DataTable.Table emptyMessage="No hay cuotas pendientes de cobro este mes." />
        <DataTable.Pagination />
      </DataTable>

      {/* Modal de confirmación */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
              Confirmar Cobro de Cuotas
            </h2>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Seguro que desea realizar el cobro de las cuotas en este momento?
          </p>

          <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-white/10">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Cuotas a procesar
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {totalCuotas}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Monto total
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {lps(montoTotal)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Empleados afectados
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {empleadosUnicos}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Registrado por
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-white/90">
                {registradoPor || "Cargando..."}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={closeModal}
              className="flex-1 p-2 rounded-md font-bold text-sm border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleRealizarPagos}
              className="flex-1 p-2 rounded-md font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              Confirmar Cobro
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}