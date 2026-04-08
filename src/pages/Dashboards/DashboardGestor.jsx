import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import MetricCard from "../../components/common/MetricCard";
import { BoxCubeIcon, GroupIcon, AlertIcon, DollarLineIcon } from "../../icons";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ResponsiveContainer,
} from "recharts";

export default function DashboardGestor() {
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [productosAgotados, setProductosAgotados] = useState(0);
  const [productosAgotadosList, setProductosAgotadosList] = useState([]);
  const [paginaAgotados, setPaginaAgotados] = useState(1);
  const [valorInventario, setValorInventario] = useState(0);
  const [periodoTopVentas, setPeriodoTopVentas] = useState("esteMes");

  const [distribucionCategorias, setDistribucionCategorias] = useState([]);
  const [valorPorCategoria, setValorPorCategoria] = useState([]);
  const [retiradosPorMes, setRetiradosPorMes] = useState([]);
  const [topProductosData, setTopProductosData] = useState({
    esteMes: [],
    ultimoMes: [],
    ultimos3Meses: [],
  });

  const [loading, setLoading] = useState(true);
  const productosPorPagina = 5;

  const colores = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7c7c",
    "#8dd1e1",
    "#d084d0",
    "#f7b500",
    "#4ade80",
  ];

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // 1. Total Categorías
        // Asumiendo que sigues teniendo una colección separada de 'categorias'
        const categoriasSnap = await getDocs(collection(db, "categoria"));
        setTotalCategorias(categoriasSnap.size);

        // 2. Extracción y cálculo de Productos Activos
        const productosSnap = await getDocs(collection(db, "productos"));
        const productos = productosSnap.docs.map((doc) => doc.data());

        // Filtramos solo los activos por si acaso tienes "inactivos" en la misma colección
        const productosActivos = productos.filter(
          (p) => p.estado === "Activo" || !p.estado,
        );
        setTotalProductos(productosActivos.length);

        let agotadosCount = 0;
        const criticos = [];
        let valorTotal = 0;
        const conteoCategorias = {};
        const valorCategorias = {};

        productosActivos.forEach((prod) => {
          // Usamos los campos exactos de tu esquema
          const stock = Number(prod.stock) || 0;
          const stockMinimo = Number(prod.stockMinimo) || 0;
          const precioContado = Number(prod.precioContado) || 0;
          const categoria = prod.categoriaNombre || "Sin Categoría";

          // Métrica: Productos en umbral mínimo
          if (stock === stockMinimo) {
            agotadosCount += 1;
            criticos.push({
              ...prod,
              stock,
              stockMinimo,
              categoriaNombre: categoria,
            });
          }

          // Métrica: Valor Total del Inventario (usando Precio de Contado)
          const valorProducto = stock * precioContado;
          valorTotal += valorProducto;

          // Agrupaciones para gráficos
          conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
          valorCategorias[categoria] =
            (valorCategorias[categoria] || 0) + valorProducto;
        });

        setProductosAgotados(agotadosCount);
        setProductosAgotadosList(criticos);
        setPaginaAgotados(1);
        setValorInventario(valorTotal);

        // Formatear datos para PieChart (Distribución)
        const chartPieData = Object.keys(conteoCategorias).map((cat) => ({
          name: cat,
          cantidad: conteoCategorias[cat],
        }));
        setDistribucionCategorias(chartPieData);

        // Formatear datos para BarChart (Valor por Categoría)
        const chartBarData = Object.keys(valorCategorias).map((cat) => ({
          name: cat,
          valor: valorCategorias[cat],
        }));
        setValorPorCategoria(chartBarData);

        // 3. Historial de Productos (Bajas definitivas)
        const historialSnap = await getDocs(
          collection(db, "historialProductos"),
        );
        const today = new Date();

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
          retirados: 0,
        }));

        historialSnap.docs.forEach((doc) => {
          const data = doc.data();
          // Usamos explícitamente tu campo fechaBaja
          const fechaBaja = data.fechaBaja?.toDate?.();

          if (fechaBaja && fechaBaja.getFullYear() === today.getFullYear()) {
            mesesBase[fechaBaja.getMonth()].retirados += 1;
          }
        });

        setRetiradosPorMes(mesesBase);
      } catch (error) {
        console.error("Error al cargar métricas de inventario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  useEffect(() => {
    const fetchTopProductos = async () => {
      try {
        const creditosSnap = await getDocs(collection(db, "creditos"));
        const creditosAprobados = creditosSnap.docs
          .map((doc) => doc.data())
          .filter((c) => c.estado === "Aprobado" && c.fechaAutoriza);

        const today = new Date();
        const primerDiaEsteMes = new Date(
          today.getFullYear(),
          today.getMonth(),
          1,
        );
        const primerDiaUltimoMes = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const primerDiaHace3Meses = new Date(
          today.getFullYear(),
          today.getMonth() - 3,
          1,
        );

        const agruparPorProducto = (creditos) => {
          const agrupado = {};
          creditos.forEach((c) => {
            const nombre = c.productoNombre || "Sin nombre";
            agrupado[nombre] =
              (agrupado[nombre] || 0) + (Number(c.cantidad) || 1);
          });
          return Object.entries(agrupado).map(([nombre, ventas]) => ({
            nombre,
            ventas,
          }));
        };

        // Este mes
        const esteMes = creditosAprobados.filter((c) => {
          const fecha =
            c.fechaAutoriza?.toDate?.() || new Date(c.fechaAutoriza);
          return fecha >= primerDiaEsteMes && fecha <= today;
        });

        // Último mes
        const ultimoMes = creditosAprobados.filter((c) => {
          const fecha =
            c.fechaAutoriza?.toDate?.() || new Date(c.fechaAutoriza);
          return fecha >= primerDiaUltimoMes && fecha < primerDiaEsteMes;
        });

        // Últimos 3 meses
        const ultimos3Meses = creditosAprobados.filter((c) => {
          const fecha =
            c.fechaAutoriza?.toDate?.() || new Date(c.fechaAutoriza);
          return fecha >= primerDiaHace3Meses && fecha <= today;
        });

        setTopProductosData({
          esteMes: agruparPorProducto(esteMes),
          ultimoMes: agruparPorProducto(ultimoMes),
          ultimos3Meses: agruparPorProducto(ultimos3Meses),
        });
      } catch (error) {
        console.error("Error al cargar top productos:", error);
      }
    };

    fetchTopProductos();
  }, []);

  // Formateador de moneda (Ajusta 'es-HN' y 'HNL' a tu país/moneda si es necesario)
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const topProductosVendidos = useMemo(() => {
    const data = topProductosData[periodoTopVentas] ?? [];
    return [...data].sort((a, b) => b.ventas - a.ventas).slice(0, 5);
  }, [periodoTopVentas, topProductosData]);

  const periodoTopVentasLabel =
    periodoTopVentas === "esteMes"
      ? "Este mes"
      : periodoTopVentas === "ultimoMes"
        ? "Último mes"
        : "Últimos 3 meses";

  const totalPaginasAgotados = Math.max(
    1,
    Math.ceil(productosAgotadosList.length / productosPorPagina),
  );
  const paginaSeguraAgotados = Math.min(paginaAgotados, totalPaginasAgotados);
  const productosAgotadosPagina = productosAgotadosList.slice(
    (paginaSeguraAgotados - 1) * productosPorPagina,
    paginaSeguraAgotados * productosPorPagina,
  );

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <MetricCard
          title="Total Productos"
          value={totalProductos}
          icon={
            <BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Total Categorías"
          value={totalCategorias}
          icon={
            <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-purple-50 dark:bg-purple-500/10"
        />
        <MetricCard
          title="Productos Agotados"
          value={productosAgotados}
          icon={<AlertIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Valor del Inventario"
          value={formatearDinero(valorInventario)}
          icon={
            <DollarLineIcon className="text-emerald-600 size-6 dark:text-emerald-400" />
          }
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
      </div>

      {/* Productos Agotados + Top Vendidos */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Productos Agotados - 35% ancho */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 xl:col-span-1">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Productos Agotados
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Stock en umbral mínimo.
              </p>
            </div>

            {productosAgotadosList.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                NO HAY PRODUCTOS AGOTADOS EN ESTE MOMENTO
              </p>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-lg border border-red-100 dark:border-red-900/30">
                <div className="overflow-y-auto max-h-72">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-red-50 dark:bg-red-900/10 border-b border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400">
                        <th className="py-2 px-3 font-semibold">Imagen</th>
                        <th className="py-2 px-3 font-semibold">Producto</th>
                        <th className="py-2 px-3 font-semibold text-center">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-50 dark:divide-red-900/20">
                      {productosAgotadosPagina.map((prod, index) => (
                        <tr
                          key={`${prod.nombre}-${index}`}
                          className="text-gray-700 dark:text-gray-300 hover:bg-red-50/50 dark:hover:bg-red-900/5 transition-colors"
                        >
                          <td className="py-2 px-3">
                            {prod.imagenUrl ? (
                              <img
                                src={prod.imagenUrl}
                                alt={prod.nombre}
                                className="h-7 w-7 rounded object-cover border border-red-200 dark:border-red-800"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                                {(prod.nombre || "P").charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium truncate">
                            {prod.nombre}
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-red-600 dark:text-red-400">
                            {prod.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/5 px-3 py-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Página {paginaSeguraAgotados} de {totalPaginasAgotados}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setPaginaAgotados(Math.max(1, paginaAgotados - 1))
                      }
                      disabled={paginaSeguraAgotados === 1}
                      className="px-2 py-1 text-xs rounded border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() =>
                        setPaginaAgotados(
                          Math.min(totalPaginasAgotados, paginaAgotados + 1),
                        )
                      }
                      disabled={paginaSeguraAgotados === totalPaginasAgotados}
                      className="px-2 py-1 text-xs rounded border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top Vendidos - 65% ancho */}
          <div className="xl:col-span-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Top 5 productos más vendidos
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Por cantidad de unidades
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Período
                </span>
                <select
                  value={periodoTopVentas}
                  onChange={(e) => setPeriodoTopVentas(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="esteMes">Este mes</option>
                  <option value="ultimoMes">Último mes</option>
                  <option value="ultimos3Meses">Últimos 3 meses</option>
                </select>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Período seleccionado: {periodoTopVentasLabel}</span>
              <span>Top 5</span>
            </div>

            <div className="h-80 text-gray-600 dark:text-gray-300">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductosVendidos}
                  layout="vertical"
                  margin={{ top: 5, right: 24, left: 16, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.2}
                  />
                  <XAxis
                    type="number"
                    stroke="currentColor"
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={140}
                    stroke="currentColor"
                  />
                  <Tooltip
                    formatter={(value) => [`${value} unidades`, "Vendidas"]}
                    labelStyle={{ color: "#111827" }}
                  />
                  <Bar dataKey="ventas" radius={[0, 10, 10, 0]}>
                    {topProductosVendidos.map((entry, index) => (
                      <Cell
                        key={`top-ventas-${entry.nombre}-${index}`}
                        fill={colores[index % colores.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos Principales */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Gráfico 1: Dona - Distribución por Categoría */}
          <div>
            <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Distribución por Categoría
            </h2>
            <div className="text-gray-600 dark:text-gray-300 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionCategorias}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="cantidad"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {distribucionCategorias.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colores[index % colores.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Barras - Valor Económico por Categoría */}
          <div>
            <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Valor del Inventario por Categoría
            </h2>
            <div className="text-gray-600 dark:text-gray-300 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={valorPorCategoria}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.2}
                  />
                  <XAxis
                    type="number"
                    stroke="currentColor"
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    stroke="currentColor"
                  />
                  <Tooltip formatter={(value) => formatearDinero(value)} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {valorPorCategoria.map((entry, index) => (
                      <Cell
                        key={`cell-bar-${index}`}
                        fill={colores[(index + 2) % colores.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
