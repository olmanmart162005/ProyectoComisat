import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import MetricCard from "../components/common/MetricCard";
import { GroupIcon, BoxCubeIcon, UserIcon, CloseIcon } from "../icons";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";

export default function DashboardRRHH() {
  const [totalEmpleados, setTotalEmpleados] = useState(0);
  const [totalDepartamentos, setTotalDepartamentos] = useState(0);
  const [empleadosNuevosEsteMes, setEmpleadosNuevosEsteMes] = useState(0);
  const [bajasEsteMes, setBajasEsteMes] = useState(0);
  const [empleadosPorDepartamento, setEmpleadosPorDepartamento] = useState([]);
  const [nominaPorDepartamento, setNominaPorDepartamento] = useState([]);
  const [movimientoMensual, setMovimientoMensual] = useState([]);
  const [loading, setLoading] = useState(true);

  const colores = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#f7b500",
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Total empleados
        const empleadosSnap = await getDocs(collection(db, "empleados"));
        setTotalEmpleados(empleadosSnap.size);

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

        const empleadosSnap2 = await getDocs(collection(db, "empleados"));
        const empleadosNuevos = empleadosSnap2.docs.filter((doc) => {
          const fechaRegistro = doc.data().fechaRegistro?.toDate?.();
          return fechaRegistro && fechaRegistro >= firstDayOfMonth;
        });
        setEmpleadosNuevosEsteMes(empleadosNuevos.length);

        // Bajas de este mes
        const historialSnap = await getDocs(
          collection(db, "historialEmpleados"),
        );
        const bajasMes = historialSnap.docs.filter((doc) => {
          const fechaBaja = doc.data().fechaBaja?.toDate?.();
          return fechaBaja && fechaBaja >= firstDayOfMonth;
        });
        setBajasEsteMes(bajasMes.length);

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

        empleadosSnap2.docs.forEach((doc) => {
          const fechaRegistro = doc.data().fechaRegistro?.toDate?.();
          if (
            fechaRegistro &&
            fechaRegistro.getFullYear() === today.getFullYear()
          ) {
            mesesBase[fechaRegistro.getMonth()].nuevos += 1;
          }
        });

        historialSnap.docs.forEach((doc) => {
          const fechaBaja = doc.data().fechaBaja?.toDate?.();
          if (fechaBaja && fechaBaja.getFullYear() === today.getFullYear()) {
            mesesBase[fechaBaja.getMonth()].bajas += 1;
          }
        });

        setMovimientoMensual(mesesBase);

        // Empleados por departamento
        const querySnapshot = await getDocs(collection(db, "empleados"));
        const empleados = querySnapshot.docs.map((doc) => doc.data());

        const departamentosCount = empleados.reduce((acc, empleado) => {
          const d = empleado.departamentoNombre || "Sin Departamento";
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.keys(departamentosCount).map(
          (departamento) => ({
            name: departamento,
            cantidad: departamentosCount[departamento],
          }),
        );

        setEmpleadosPorDepartamento(chartData);

        const nominaDepartamentos = empleados.reduce((acc, empleado) => {
          const d = empleado.departamentoNombre || "Sin Departamento";
          acc[d] = (acc[d] || 0) + (Number(empleado.salario) || 0);
          return acc;
        }, {});

        const chartNomina = Object.keys(nominaDepartamentos).map(
          (departamento) => ({
            name: departamento,
            nomina: nominaDepartamentos[departamento],
          }),
        );

        setNominaPorDepartamento(chartNomina);
      } catch (error) {
        console.error("Error al cargar métricas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <MetricCard
          title="Total Empleados"
          value={totalEmpleados}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Total Departamentos"
          value={totalDepartamentos}
          icon={
            <BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Empleados Nuevos Este Mes"
          value={empleadosNuevosEsteMes}
          icon={
            <UserIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-green-50 dark:bg-green-500/10"
        />
        <MetricCard
          title="Despedidos este mes"
          value={bajasEsteMes}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Empleados por Departamento
            </h2>
            <div className="text-gray-600 dark:text-gray-300">
              <BarChart
                style={{
                  width: "100%",
                  maxWidth: "700px",
                  maxHeight: "70vh",
                  aspectRatio: 1.618,
                }}
                layout="vertical"
                responsive
                data={empleadosPorDepartamento}
                margin={{
                  top: 5,
                  right: 0,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid stroke="currentColor" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  stroke="currentColor"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="currentColor"
                />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[0, 10, 10, 0]}>
                  {empleadosPorDepartamento.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colores[index % colores.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Nómina por Departamento
            </h2>
            <div className="text-gray-600 dark:text-gray-300">
              <BarChart
                style={{
                  width: "100%",
                  maxWidth: "700px",
                  maxHeight: "70vh",
                  aspectRatio: 1.618,
                }}
                layout="vertical"
                responsive
                data={nominaPorDepartamento}
                margin={{
                  top: 5,
                  right: 0,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid stroke="currentColor" strokeDasharray="3 3" />
                <XAxis type="number" stroke="currentColor" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="currentColor"
                />
                <Tooltip />
                <Bar dataKey="nomina" radius={[0, 10, 10, 0]}>
                  {nominaPorDepartamento.map((entry, index) => (
                    <Cell
                      key={`nomina-cell-${index}`}
                      fill={colores[index % colores.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
            Empleados Nuevos y Bajas por Mes
          </h2>
          <div className="text-gray-600 dark:text-gray-300">
            <LineChart
              style={{
                width: "100%",
                maxWidth: "700px",
                height: "100%",
                maxHeight: "70vh",
                aspectRatio: 1.618,
              }}
              responsive
              data={movimientoMensual}
              margin={{
                top: 5,
                right: 0,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
              <XAxis dataKey="name" stroke="currentColor" />
              <YAxis width="auto" allowDecimals={false} stroke="currentColor" />
              <Tooltip />
              <Line type="monotone" dataKey="nuevos" stroke="#3b82f6" />
              <Line type="monotone" dataKey="bajas" stroke="#ef4444" />
            </LineChart>
          </div>
        </div>
      )}
    </div>
  );
}
