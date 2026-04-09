import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
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

const ESTADOS_CERRADOS = ["pagado", "cancelado", "finalizado"];

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
  const [loading, setLoading] = useState(true);
  const [creditos, setCreditos] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [periodoResumen, setPeriodoResumen] = useState("6");

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
        return aprobado && !ESTADOS_CERRADOS.includes(estadoCredito);
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

  const solicitudesRecientes = useMemo(() => {
    const filtradas =
      filtroEstado === "todos"
        ? creditosOrdenados
        : creditosOrdenados.filter(
            (c) => String(c.estado ?? "").toLowerCase() === filtroEstado,
          );
    return filtradas.slice(0, 8);
  }, [creditosOrdenados, filtroEstado]);

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
        .slice(0, 6)
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

  const pagosPlanilla = useMemo(() => {
    const agrupado = {};
    creditosActivos.forEach((credito) => {
      const nombre =
        `${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim() ||
        "Sin nombre";
      const cuota = Number(
        credito.datosFinancierosHistoricos?.cuotaMensual ??
          credito.cuotaMensual ??
          0,
      );
      agrupado[nombre] = (agrupado[nombre] || 0) + cuota;
    });

    return Object.entries(agrupado)
      .map(([name, cuota]) => ({ name, cuota }))
      .sort((a, b) => b.cuota - a.cuota)
      .slice(0, 8);
  }, [creditosActivos]);

  const tendenciaMensual = useMemo(() => {
    const meses = Number(periodoResumen);
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
    periodoResumen === "6" ? "Últimos 6 meses" : "Últimos 12 meses";

  const estadoFiltros = [
    { value: "todos", label: "Todos" },
    { value: "pendiente", label: "Pendientes" },
    { value: "aprobado", label: "Aprobados" },
    { value: "rechazado", label: "Rechazados" },
    { value: "cancelado", label: "Cancelados" },
  ];

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
          icon={
            <CheckCircleIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          }
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MetricCard
          title="Monto cobrado"
          value={lps(montoCobradoMes)}
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
                  Revisiones más recientes desde Firebase
                </p>
              </div>

              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
              >
                {estadoFiltros.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <div className="overflow-y-auto max-h-80">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                    <tr className="border-b border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300">
                      <th className="py-2 px-3 font-semibold">Empleado</th>
                      <th className="py-2 px-3 font-semibold">Artículo</th>
                      <th className="py-2 px-3 font-semibold">Monto</th>
                      <th className="py-2 px-3 font-semibold text-center">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {solicitudesRecientes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 px-3 text-center text-gray-500 dark:text-gray-400"
                        >
                          No hay solicitudes para mostrar.
                        </td>
                      </tr>
                    ) : (
                      solicitudesRecientes.map((credito, index) => (
                        <tr
                          key={
                            credito.id ?? `${credito.productoNombre}-${index}`
                          }
                          className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium max-w-[140px] truncate">
                            {`${credito.empleadoNombres ?? ""} ${credito.empleadoApellidos ?? ""}`.trim() ||
                              credito.empleadoNombre ||
                              "---"}
                          </td>
                          <td className="py-2 px-3 max-w-[140px] truncate">
                            {credito.productoNombre ?? "---"}
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {lps(
                              credito.datosFinancierosHistoricos
                                ?.totalCredito ??
                                credito.saldoPendiente ??
                                0,
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${estadoBadge(credito.estado)}`}
                            >
                              {credito.estado ?? "---"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Perfil financiero — top deudores
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Saldo pendiente por empleado
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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Pagos de planilla
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cuota mensual por empleado
              </p>
            </div>

            <div className="h-72 text-gray-600 dark:text-gray-300">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={pagosPlanilla}
                  margin={{ top: 4, right: 8, left: 4, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.12}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                      fill: "currentColor",
                      angle: -30,
                      textAnchor: "end",
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    tickFormatter={lpsCompacto}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip currency />} />
                  <Bar
                    dataKey="cuota"
                    name="Cuota mensual"
                    radius={[4, 4, 0, 0]}
                  >
                    {pagosPlanilla.map((entry, index) => (
                      <Cell
                        key={`planilla-${entry.name}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Créditos y monto cobrado
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tendencia mensual
                </p>
              </div>

              <select
                value={periodoResumen}
                onChange={(e) => setPeriodoResumen(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="6">Últimos 6 meses</option>
                <option value="12">Últimos 12 meses</option>
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
                      <stop
                        offset="5%"
                        stopColor="#378ADD"
                        stopOpacity={0.28}
                      />
                      <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="montoCobradoGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#1D9E75"
                        stopOpacity={0.25}
                      />
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
        </div>
      )}
    </div>
  );
}
