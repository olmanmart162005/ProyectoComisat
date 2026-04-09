import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

import MetricCard from "../../components/common/MetricCard";
import { GroupIcon, BoxCubeIcon, UserIcon, CloseIcon } from "../../icons";
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

const obtenerIniciales = (nombreCompleto) => {
  const limpio = String(nombreCompleto ?? "").trim();
  if (!limpio) return "--";

  const partes = limpio.split(/\s+/).filter(Boolean);
  const primeras = partes.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return primeras.join("");
};

const resolverNombreEmpleado = (baja) => {
  const nombreDirecto = String(
    baja?.empleadoNombreCompleto ?? baja?.empleadoNombre ?? baja?.nombre ?? "",
  ).trim();

  const nombrePartesA =
    `${baja?.empleadoNombres ?? ""} ${baja?.empleadoApellidos ?? ""}`.trim();
  const nombrePartesB =
    `${baja?.nombres ?? ""} ${baja?.apellidos ?? ""}`.trim();

  return nombreDirecto || nombrePartesA || nombrePartesB || "Sin nombre";
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-white/10 dark:bg-gray-900">
      <p className="mb-1 font-semibold text-gray-900 dark:text-white/90">
        {label}
      </p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-gray-600 dark:text-gray-300">
          <span style={{ color: item.color }}>{item.name}:</span> {item.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardRRHH() {
  const navigate = useNavigate();
  const [totalEmpleados, setTotalEmpleados] = useState(0);
  const [totalDepartamentos, setTotalDepartamentos] = useState(0);
  const [empleadosNuevosEsteMes, setEmpleadosNuevosEsteMes] = useState(0);
  const [bajasEsteMes, setBajasEsteMes] = useState(0);
  const [distribucionDepartamentos, setDistribucionDepartamentos] = useState(
    [],
  );
  const [bajasRecientes, setBajasRecientes] = useState([]);
  const [movimientoMensual, setMovimientoMensual] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Total empleados
        const empleadosSnap = await getDocs(collection(db, "empleados"));
        const empleados = empleadosSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setTotalEmpleados(empleados.length);

        // Total departamentos
        const departamentosSnap = await getDocs(
          collection(db, "departamentos"),
        );
        setTotalDepartamentos(departamentosSnap.size);

        // Empleados nuevos este mes
        const today = new Date();
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );

        const empleadosNuevos = empleados.filter((doc) => {
          const fechaRegistro = toDateValue(doc.fechaRegistro);
          return fechaRegistro && fechaRegistro >= firstDayOfMonth;
        });
        setEmpleadosNuevosEsteMes(empleadosNuevos.length);

        // Bajas de este mes y recientes
        const historialSnap = await getDocs(
          collection(db, "historialEmpleados"),
        );
        const historialDatos = historialSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const bajasMes = historialDatos.filter((doc) => {
          const fechaBaja = toDateValue(doc.fechaBaja);
          return fechaBaja && fechaBaja >= firstDayOfMonth;
        });
        setBajasEsteMes(bajasMes.length);

        // Bajas recientes (ordenadas por fecha, últimas 2)
        const bajasOrdenadas = [...bajasMes].sort(
          (a, b) => toMillis(b.fechaBaja) - toMillis(a.fechaBaja),
        );
        setBajasRecientes(bajasOrdenadas.slice(0, 2));

        // Distribución por departamento (Donut)
        const departamentosCount = empleados.reduce((acc, empleado) => {
          const d = empleado.departamentoNombre || "Sin Departamento";
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});

        const departamentosBase = departamentosSnap.docs
          .map((doc) => String(doc.data()?.nombre ?? "").trim())
          .filter(Boolean);

        const departamentosUnicos = [...new Set(departamentosBase)];

        const chartData = departamentosUnicos.map((departamento) => ({
          name: departamento,
          value: departamentosCount[departamento] ?? 0,
        }));

        if (departamentosCount["Sin Departamento"]) {
          chartData.push({
            name: "Sin Departamento",
            value: departamentosCount["Sin Departamento"],
          });
        }

        setDistribucionDepartamentos(chartData);

        // Movimiento mensual (nuevos vs bajas)
        const meses = [
          "Ene",
          "Feb",
          "Mar",
          "Abr",
          "May",
          "Jun",
          "Jul",
          "Ago",
          "Sep",
          "Oct",
          "Nov",
          "Dic",
        ];

        const mesesBase = meses.map((mes) => ({
          name: mes,
          nuevos: 0,
          bajas: 0,
        }));

        empleados.forEach((doc) => {
          const fechaRegistro = toDateValue(doc.fechaRegistro);
          if (
            fechaRegistro &&
            fechaRegistro.getFullYear() === today.getFullYear()
          ) {
            mesesBase[fechaRegistro.getMonth()].nuevos += 1;
          }
        });

        historialDatos.forEach((doc) => {
          const fechaBaja = toDateValue(doc.fechaBaja);
          if (fechaBaja && fechaBaja.getFullYear() === today.getFullYear()) {
            mesesBase[fechaBaja.getMonth()].bajas += 1;
          }
        });

        setMovimientoMensual(mesesBase);
      } catch (error) {
        console.error("Error al cargar métricas de RRHH:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Fila 1: 4 Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={totalEmpleados}
          icon={
            <GroupIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Total Departamentos"
          value={totalDepartamentos}
          icon={
            <BoxCubeIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          }
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MetricCard
          title="Empleados nuevos"
          value={empleadosNuevosEsteMes}
          subtitle="Este mes"
          icon={
            <UserIcon className="text-amber-600 size-6 dark:text-amber-400" />
          }
          iconWrapperClass="bg-amber-50 dark:bg-amber-500/10"
        />
        <MetricCard
          title="Bajas recientes"
          value={bajasEsteMes}
          subtitle="Este mes"
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-stretch">
          <div className="space-y-6">
            {/* Donut: Distribución por departamento */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Distribución por departamento
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Empleados por departamento
                </p>
              </div>

              <div className="h-80 text-gray-600 dark:text-gray-300">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={distribucionDepartamentos}
                      cx="50%"
                      cy="44%"
                      innerRadius={58}
                      outerRadius={92}
                      labelLine={false}
                      label={false}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                    >
                      {distribucionDepartamentos.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      payload={distribucionDepartamentos.map((dep, index) => ({
                        id: dep.name,
                        value: `${dep.name} (${dep.value})`,
                        type: "square",
                        color: COLORS[index % COLORS.length],
                      }))}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bajas recientes */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Bajas recientes
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Últimos 2 registros
                  </p>
                </div>

                <div className="flex items-start">
                  <button
                    type="button"
                    onClick={() => navigate("/historial-empleados")}
                    className="text-xs font-medium text-blue-600 transition hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Ver todas
                  </button>
                </div>
              </div>

              <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 dark:border-white/10 dark:bg-gray-900 dark:text-gray-300">
                      <th className="py-2 px-3 font-semibold">Empleado</th>
                      <th className="py-2 px-3 font-semibold">Departamento</th>
                      <th className="py-2 px-3 font-semibold text-center">
                        Fecha de baja
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                    {bajasRecientes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-6 px-3 text-center text-gray-500 dark:text-gray-400"
                        >
                          No hay bajas recientes para mostrar.
                        </td>
                      </tr>
                    ) : (
                      bajasRecientes.map((baja, index) => {
                        const nombreEmpleado = resolverNombreEmpleado(baja);
                        const departamento = baja.departamentoNombre || "---";
                        const fechaBaja = toDateValue(baja.fechaBaja);
                        const fechaFormato = fechaBaja
                          ? fechaBaja.toLocaleDateString("es-HN")
                          : "---";

                        return (
                          <tr
                            key={baja.id ?? `baja-${index}`}
                            className="text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                          >
                            <td className="py-2 px-3 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div
                                  title={nombreEmpleado}
                                  aria-label={nombreEmpleado}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                                >
                                  {obtenerIniciales(nombreEmpleado)}
                                </div>
                                <span className="block font-medium text-gray-700 dark:text-gray-300">
                                  {nombreEmpleado}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3 align-middle text-gray-600 dark:text-gray-400">
                              {departamento}
                            </td>
                            <td className="py-2 px-3 text-center align-middle text-gray-600 dark:text-gray-400">
                              {fechaFormato}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Movimiento: ocupa toda la columna derecha */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 h-full">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Movimiento de personal por mes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tendencia de rotación: empleados nuevos vs bajas a lo largo del
                año
              </p>
            </div>

            <div className="h-[520px] text-gray-600 dark:text-gray-300">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={movimientoMensual}
                  margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.12}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                  <Line
                    type="monotone"
                    dataKey="nuevos"
                    name="Empleados nuevos"
                    stroke="#378ADD"
                    strokeWidth={2}
                    dot={{ fill: "#378ADD", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bajas"
                    name="Bajas"
                    stroke="#E24B4A"
                    strokeWidth={2}
                    dot={{ fill: "#E24B4A", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
