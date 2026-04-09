import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import MetricCard from "../../components/common/MetricCard";
import {
  AlertIcon,
  CheckCircleIcon,
  DollarLineIcon,
  GroupIcon,
} from "../../icons";
import { db } from "../../firebase/firebase";

const COLORS = [
  "#378ADD",
  "#1D9E75",
  "#EF9F27",
  "#E24B4A",
  "#534AB7",
  "#D85A30",
  "#82ca9d",
  "#ffc658",
];

const lps = (n) =>
  new Intl.NumberFormat("es-HN", {
    style: "currency",
    currency: "HNL",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

const lpsCompacto = (n) => {
  const value = Number(n ?? 0);
  if (value >= 1_000_000) return `L. ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `L. ${(value / 1_000).toFixed(0)}k`;
  return lps(value);
};

const toDateValue = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toMillis = (value) => toDateValue(value)?.getTime?.() ?? 0;

const mesKey = (date) => {
  const d = toDateValue(date);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const mesLabel = (date) => {
  const d = toDateValue(date);
  if (!d) return "";
  return d.toLocaleDateString("es-HN", { month: "short" });
};

const estadoBadge = (estado) => {
  const val = String(estado ?? "").toLowerCase();
  if (val === "aprobado" || val === "activo")
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (val === "pendiente")
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
  if (val === "rechazado" || val === "cancelado")
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400";
  if (val === "pagado")
    return "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
  return "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300";
};

const obtenerIniciales = (nombreCompleto) => {
  const limpio = String(nombreCompleto ?? "").trim();
  if (!limpio) return "--";

  const partes = limpio.split(/\s+/).filter(Boolean);
  const primeras = partes.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return primeras.join("");
};

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-gray-900">
      <p className="mb-1 font-semibold text-gray-900 dark:text-white/90">
        {label}
      </p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-gray-600 dark:text-gray-300">
          <span style={{ color: item.color }}>{item.name}:</span>{" "}
          {currency ? lps(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardOficial() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creditos, setCreditos] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [periodoResumen, setPeriodoResumen] = useState("mes");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [snapCreditos, snapCuotas] = await Promise.all([
          getDocs(collection(db, "creditos")),
          getDocs(collection(db, "cuotas")),
        ]);

        setCreditos(snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCuotas(snapCuotas.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error al cargar dashboard oficial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const creditosOrdenados = useMemo(
    () =>
      [...creditos].sort(
        (a, b) => toMillis(b.fechaRegistro) - toMillis(a.fechaRegistro),
      ),
    [creditos],
  );

  const creditosPendientes = useMemo(
    () =>
      creditos.filter(
        (c) => String(c.estado ?? "").toLowerCase() === "pendiente",
      ),
    [creditos],
  );

  const creditosAprobadosMes = useMemo(
    () =>
      creditos.filter((c) => {
        const estado = String(c.estado ?? "").toLowerCase();
        if (estado !== "aprobado") return false;
        const fecha = c.fechaAutoriza ?? c.fechaRegistro;
        return mesKey(fecha) === mesActual;
      }),
    [creditos, mesActual],
  );

  const creditosActivos = useMemo(
    () =>
      creditos.filter((c) => {
        const aprobado = String(c.estado ?? "").toLowerCase() === "aprobado";
        const estadoCredito = String(c.estadoCredito ?? "").toLowerCase();
        return aprobado && estadoCredito === "activo";
      }),
    [creditos],
  );

  const empleadosConCredito = useMemo(() => {
    const keys = new Set();
    creditosActivos.forEach((c) => {
      const key = String(
        c.empleadoId ??
          c.empleadoUid ??
          `${c.empleadoNombres ?? ""}|${c.empleadoApellidos ?? ""}`,
      )
        .trim()
        .toLowerCase();
      if (key) keys.add(key);
    });
    return keys.size;
  }, [creditosActivos]);

  const montoCobradoMes = useMemo(
    () =>
      cuotas
        .filter((c) => String(c.mesCobro ?? "") === mesActual)
        .reduce((acc, c) => acc + Number(c.montoCuota ?? 0), 0),
    [cuotas, mesActual],
  );

  const saldoPendienteTotal = useMemo(
    () =>
      creditosActivos.reduce(
        (acc, c) =>
          acc +
          Number(
            c.saldoPendiente ?? c.datosFinancierosHistoricos?.totalCredito ?? 0,
          ),
        0,
      ),
    [creditosActivos],
  );

  const solicitudesRecientes = useMemo(
    () => creditosOrdenados.slice(0, 6),
    [creditosOrdenados],
  );

  const topDeudores = useMemo(
    () =>
      [...creditosActivos]
        .sort(
          (a, b) =>
            Number(
              b.saldoPendiente ??
                b.datosFinancierosHistoricos?.totalCredito ??
                0,
            ) -
            Number(
              a.saldoPendiente ??
                a.datosFinancierosHistoricos?.totalCredito ??
                0,
            ),
        )
        .slice(0, 5)
        .map((credito) => ({
          name:
            `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim() ||
            credito.productoNombre ||
            "Sin nombre",
          saldo: Number(
            credito.saldoPendiente ??
              credito.datosFinancierosHistoricos?.totalCredito ??
              0,
          ),
        })),
    [creditosActivos],
  );

  const tendenciaMensual = useMemo(() => {
    const meses =
      periodoResumen === "mes" ? 1 : periodoResumen === "3meses" ? 3 : 12;
    const base = [];
    for (let i = meses - 1; i >= 0; i -= 1) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      base.push({
        key: mesKey(fecha),
        mes: mesLabel(fecha),
        creditosAprobados: 0,
        montoCobrado: 0,
      });
    }

    const mapa = new Map(base.map((item) => [item.key, item]));

    creditos.forEach((credito) => {
      const estado = String(credito.estado ?? "").toLowerCase();
      if (estado !== "aprobado") return;
      const key = mesKey(credito.fechaAutoriza ?? credito.fechaRegistro);
      const item = mapa.get(key);
      if (item) item.creditosAprobados += 1;
    });

    cuotas.forEach((cuota) => {
      const key = String(cuota.mesCobro ?? "");
      const item = mapa.get(key);
      if (item) item.montoCobrado += Number(cuota.montoCuota ?? 0);
    });

    return base;
  }, [creditos, cuotas, periodoResumen, hoy]);

  const periodLabel =
    periodoResumen === "mes"
      ? "Mes actual"
      : periodoResumen === "3meses"
        ? "Últimos 3 meses"
        : "Último año";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <MetricCard
          title="Solicitudes pendientes"
          value={creditosPendientes.length}
          icon={
            <AlertIcon className="text-amber-600 size-6 dark:text-amber-400" />
          }
          iconWrapperClass="bg-amber-50 dark:bg-amber-500/10"
        />
        <MetricCard
          title="Créditos aprobados"
          value={creditosAprobadosMes.length}
          subtitle="Este mes"
          icon={
            <CheckCircleIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          }
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MetricCard
          title="Cartera activa"
          value={lps(saldoPendienteTotal)}
          subtitle="Saldo pendiente total de créditos activos"
          icon={
            <DollarLineIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Empleados con crédito"
          value={empleadosConCredito}
          icon={
            <GroupIcon className="text-violet-600 size-6 dark:text-violet-400" />
          }
          iconWrapperClass="bg-violet-50 dark:bg-violet-500/10"
        />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 xl:col-span-1">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Solicitudes recientes
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Resumen de las solicitudes más recientes
                </p>
              </div>

              <div className="flex items-start">
                <button
                  type="button"
                  onClick={() => navigate("/solicitudes-reservas")}
                  className="text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Ver todas
                </button>
              </div>
            </div>

            <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
                    <th className="w-14 py-2 px-3 text-center font-semibold">
                      <span className="sr-only">Empleado</span>
                    </th>
                    <th className="py-2 px-3 font-semibold">Artículo</th>
                    <th className="py-2 px-3 font-semibold text-center">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {solicitudesRecientes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-6 px-3 text-center text-gray-500 dark:text-gray-400"
                      >
                        No hay solicitudes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    solicitudesRecientes.map((credito, index) => {
                      const nombreEmpleado =
                        `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim() ||
                        credito.empleadoNombre ||
                        "---";

                      return (
                        <tr
                          key={
                            credito.id ?? `${credito.productoNombre}-${index}`
                          }
                          className="text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <td className="py-2 px-3 text-center align-middle">
                            <div
                              title={nombreEmpleado}
                              aria-label={nombreEmpleado}
                              className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            >
                              {obtenerIniciales(nombreEmpleado)}
                            </div>
                          </td>
                          <td className="py-2 px-3 align-middle font-medium text-gray-700 dark:text-gray-300">
                            <span className="block whitespace-normal break-words leading-5">
                              {credito.productoNombre ?? "---"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center align-middle">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${estadoBadge(credito.estado)}`}
                            >
                              {credito.estado ?? "---"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Top 5 deudores por saldo activo
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Empleados con mayor saldo pendiente en créditos activos
                </p>
              </div>
            </div>

            <div className="h-80 text-gray-600 dark:text-gray-300">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDeudores}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.12}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="currentColor"
                    tickFormatter={lpsCompacto}
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={115}
                    stroke="currentColor"
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip currency />} />
                  <Bar
                    dataKey="saldo"
                    name="Saldo pendiente"
                    radius={[0, 8, 8, 0]}
                  >
                    {topDeudores.map((entry, index) => (
                      <Cell
                        key={`deudor-${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Créditos y monto cobrado
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Compara créditos aprobados vs cobros por planilla (monto de
                cuotas) por mes
              </p>
            </div>

            <select
              value={periodoResumen}
              onChange={(e) => setPeriodoResumen(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="mes">Mes actual</option>
              <option value="3meses">Últimos 3 meses</option>
              <option value="1anio">Último año</option>
            </select>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Período seleccionado: {periodLabel}</span>
            <span>Datos reales desde Firebase</span>
          </div>

          <div className="h-72 text-gray-600 dark:text-gray-300">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={tendenciaMensual}
                margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
              >
                <defs>
                  <linearGradient
                    id="creditosAprobadosGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#378ADD" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="montoCobradoGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  opacity={0.12}
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  tickFormatter={lpsCompacto}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip currency={false} />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="creditosAprobados"
                  name="Créditos aprobados"
                  stroke="#378ADD"
                  strokeWidth={2}
                  fill="url(#creditosAprobadosGradient)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="montoCobrado"
                  name="Monto cobrado"
                  stroke="#1D9E75"
                  strokeWidth={2}
                  fill="url(#montoCobradoGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
