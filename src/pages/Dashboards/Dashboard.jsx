import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Componentes UI propios
import MetricCard from "../../components/common/MetricCard";
import Badge from "../../components/ui/badge/Badge";
import { Users, Activity, AlertTriangle, ShieldCheck, History, UserCheck, Layers } from "lucide-react"; 

// Gráficos
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

// ── Helpers de color vinculados a tu componente Badge ──────────────────────
function getAccionColor(accion) {
  if (!accion) return "light";
  const a = accion.toLowerCase();
  switch (a) {
    case "creacion": return "primary";
    case "actualizacion": return "success";
    case "eliminacion": return "error";
    case "aprobacion": return "teal";
    case "rechazo": return "pink";
    case "ingreso": return "purple";
    case "primer ingreso": return "indigo";
    default: return "info";
  }
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({ totalUsers: 0, actionsToday: 0, criticalActions: 0, activeRoles: 0 });
  const [roleData, setRoleData] = useState([]);
  const [moduleData, setModuleData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS_PALETTE = ["#0a4b8f", "#10b981", "#f75c01", "#ef4444", "#05274f", "#0284c7", "#f59e0b", "#475569"];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // 1. Cargar Roles (para la métrica de cantidad de roles configurados)
        const rolesSnap = await getDocs(collection(db, "roles"));

        // 2. Cargar Usuarios (Usando rolNombre según tu captura)
        const usersSnap = await getDocs(collection(db, "usuarios"));
        const usuarios = usersSnap.docs.map(d => d.data());
        
        const conteoRoles = {};
        usuarios.forEach(u => {
          // Usamos rolNombre que es el campo que mostraste en la imagen
          const nombreRol = u.rolNombre || "Sin asignar";
          conteoRoles[nombreRol] = (conteoRoles[nombreRol] || 0) + 1;
        });

        // 3. Cargar Bitácora (Últimos 500)
        const bitacoraSnap = await getDocs(
          query(collection(db, "bitacora"), orderBy("fecha", "desc"), limit(500))
        );
        const logs = bitacoraSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 4. Procesar Colecciones dinámicamente
        const modulosConteo = {};
        logs.forEach(l => {
          const mod = l.coleccion ? l.coleccion.charAt(0).toUpperCase() + l.coleccion.slice(1) : "Otros";
          modulosConteo[mod] = (modulosConteo[mod] || 0) + 1;
        });

        const hoyLogs = logs.filter(l => l.fecha?.toDate() >= hoy);
        const eliminacionesHoy = hoyLogs.filter(l => l.accion?.toLowerCase() === "eliminacion");

        // Setear estados finales
        setRoleData(Object.keys(conteoRoles).map(name => ({ name, value: conteoRoles[name] })));
        setModuleData(Object.keys(modulosConteo).map(name => ({ name, total: modulosConteo[name] })));
        setMetrics({
          totalUsers: usersSnap.size,
          actionsToday: hoyLogs.length,
          criticalActions: eliminacionesHoy.length,
          activeRoles: rolesSnap.size
        });
        setRecentLogs(logs.slice(0, 6));

      } catch (error) {
        console.error("Error Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Métricas Superiores ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Usuarios"
          value={metrics.totalUsers}
          icon={<Users className="text-blue-600 dark:text-blue-400 size-6" />}
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
        <MetricCard
          title="Acciones Hoy"
          value={metrics.actionsToday}
          icon={<Activity className="text-emerald-600 dark:text-emerald-400 size-6" />}
          iconWrapperClass="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <MetricCard
          title="Eliminaciones (24h)"
          value={metrics.criticalActions}
          icon={<AlertTriangle className="text-rose-600 dark:text-rose-400 size-6" />}
          iconWrapperClass="bg-rose-50 dark:bg-rose-500/10"
        />
        <MetricCard
          title="Roles Activos"
          value={metrics.activeRoles}
          icon={<ShieldCheck className="text-[#05274f] dark:text-blue-300 size-6" />}
          iconWrapperClass="bg-slate-100 dark:bg-blue-900/30"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Gráfico 1: Usuarios por Rol (Dona) ── */}
        <div className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#05274f] dark:text-blue-400">
                <UserCheck size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Distribución de Personal
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Usuarios agrupados por rol
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {metrics.totalUsers} total
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  innerRadius={68}
                  outerRadius={94}
                  paddingAngle={5}
                  cornerRadius={5}
                  dataKey="value"
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS_PALETTE[i % COLORS_PALETTE.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Legend
                  iconType="circle"
                  formatter={(val) => (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {val}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Gráfico 2: Actividad por Módulo (Barras Horizontales) ── */}
        <div className="bg-white dark:bg-slate-900/90 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-[#f75c01] dark:text-amber-400">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Movimiento por Colección
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Actividad histórica en bitácora
                </p>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fill: "currentColor", fontSize: 11 }}
                  className="text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px]"
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Bar dataKey="total" fill="#0a4b8f" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tabla de Auditoría ── */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#05274f] dark:text-blue-400">
              <History size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Auditoría del Sistema
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Últimos registros en tiempo real
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            En Vivo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                <th className="px-6 py-3.5 font-bold uppercase text-[10px] tracking-wider">Usuario</th>
                <th className="px-6 py-3.5 font-bold uppercase text-[10px] tracking-wider">Acción</th>
                <th className="px-6 py-3.5 font-bold uppercase text-[10px] tracking-wider">Módulo</th>
                <th className="px-6 py-3.5 font-bold uppercase text-[10px] tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    <span className="block truncate max-w-[200px] font-semibold">{log.nombre || "Sistema"}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">{log.usuario}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge size="sm" color={getAccionColor(log.accion)} variant="light">
                      {log.accion?.toUpperCase() || "ACCIÓN"}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400 text-xs capitalize font-medium">
                    {log.coleccion}
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 dark:text-slate-500 text-xs font-mono">
                    {log.fecha?.toDate().toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}