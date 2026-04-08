import { useEffect, useState } from "react";
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
  ResponsiveContainer
} from "recharts";

export default function DashboardGestor() {
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [productosAgotados, setProductosAgotados] = useState(0);
  const [valorInventario, setValorInventario] = useState(0);
  
  const [distribucionCategorias, setDistribucionCategorias] = useState([]);
  const [valorPorCategoria, setValorPorCategoria] = useState([]);
  const [retiradosPorMes, setRetiradosPorMes] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const colores = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", 
    "#8dd1e1", "#d084d0", "#f7b500", "#4ade80"
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
        const productosActivos = productos.filter(p => p.estado === "Activo" || !p.estado);
        setTotalProductos(productosActivos.length);

        let agotadosCount = 0;
        let valorTotal = 0;
        const conteoCategorias = {};
        const valorCategorias = {};

        productosActivos.forEach((prod) => {
          // Usamos los campos exactos de tu esquema
          const stock = Number(prod.stock) || 0;
          const stockMinimo = Number(prod.stockMinimo) || 0;
          const precioContado = Number(prod.precioContado) || 0;
          const categoria = prod.categoriaNombre || "Sin Categoría";

          // Métrica: Productos Agotados / Críticos
          if (stock <= stockMinimo) {
            agotadosCount += 1;
          }

          // Métrica: Valor Total del Inventario (usando Precio de Contado)
          const valorProducto = stock * precioContado;
          valorTotal += valorProducto;

          // Agrupaciones para gráficos
          conteoCategorias[categoria] = (conteoCategorias[categoria] || 0) + 1;
          valorCategorias[categoria] = (valorCategorias[categoria] || 0) + valorProducto;
        });

        setProductosAgotados(agotadosCount);
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
        const historialSnap = await getDocs(collection(db, "historialProductos"));
        const today = new Date();
        
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
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

  // Formateador de moneda (Ajusta 'es-HN' y 'HNL' a tu país/moneda si es necesario)
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL', 
      maximumFractionDigits: 0
    }).format(monto);
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
        <MetricCard
          title="Total Productos"
          value={totalProductos}
          icon={<BoxCubeIcon className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Total Categorías"
          value={totalCategorias}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
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
          icon={<DollarLineIcon className="text-emerald-600 size-6 dark:text-emerald-400" />}
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
      </div>

      {/* Gráficos Principales */}
      {!loading && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          
          {/* Gráfico 1: Dona - Distribución por Categoría */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
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
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {distribucionCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Barras - Valor Económico por Categoría */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
              Valor del Inventario por Categoría
            </h2>
            <div className="text-gray-600 dark:text-gray-300 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valorPorCategoria} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                  <XAxis type="number" stroke="currentColor" tickFormatter={(value) => `$${value}`} />
                  <YAxis type="category" dataKey="name" width={120} stroke="currentColor" />
                  <Tooltip formatter={(value) => formatearDinero(value)} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {valorPorCategoria.map((entry, index) => (
                      <Cell key={`cell-bar-${index}`} fill={colores[(index + 2) % colores.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico Recomendado: Área - Historial de Retiros */}
      {!loading && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Productos Dados de Baja por Mes
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Histórico de productos retirados permanentemente en el año actual.
            </p>
          </div>
          
          <div className="text-gray-600 dark:text-gray-300 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={retiradosPorMes} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRetirados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                <XAxis dataKey="name" stroke="currentColor" />
                <YAxis allowDecimals={false} stroke="currentColor" />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="retirados" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorRetirados)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}