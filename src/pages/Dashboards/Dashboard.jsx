import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase/firebase";

// Componentes UI propios
import MetricCard from "../../components/common/MetricCard";
import Badge from "../../components/ui/badge/Badge";
import { Users, Activity, AlertTriangle, ShieldCheck, History, UserCheck } from "lucide-react"; 

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

  const COLORS_PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1"];

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
    <div className="space-y-6 p-1">
      {/* ── Métricas Superiores ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Usuarios" value={metrics.totalUsers} icon={<Users className="text-blue-600 size-6" />} iconWrapperClass="bg-blue-50 dark:bg-blue-500/10" />
        <MetricCard title="Acciones Hoy" value={metrics.actionsToday} icon={<Activity className="text-success-600 size-6" />} iconWrapperClass="bg-success-50 dark:bg-success-500/10" />
        <MetricCard title="Eliminaciones (24h)" value={metrics.criticalActions} icon={<AlertTriangle className="text-error-600 size-6" />} iconWrapperClass="bg-error-50 dark:bg-error-500/10" />
        <MetricCard title="Roles Activos" value={metrics.activeRoles} icon={<ShieldCheck className="text-purple-600 size-6" />} iconWrapperClass="bg-purple-50 dark:bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Gráfico 1: Usuarios por Rol (Dona) ── */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest flex items-center gap-2">
            <UserCheck size={14} /> Distribución de Personal
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                  {roleData.map((_, i) => <Cell key={i} fill={COLORS_PALETTE[i % COLORS_PALETTE.length]} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#111827', color: '#fff' }} />
                <Legend iconType="circle" formatter={(val) => <span className="text-xs font-medium dark:text-gray-400">{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Gráfico 2: Actividad por Módulo (Barras Horizontales) ── */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Movimiento por Colección</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moduleData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} strokeOpacity={0.05} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'currentColor', fontSize: 10 }} className="text-gray-400 font-bold uppercase" />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 5, 5, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Tabla de Auditoría ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 font-bold text-gray-800 dark:text-white/90">
          <History size={18} className="text-brand-500" /> Auditoría en Tiempo Real
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-50 dark:border-white/5">
                <th className="px-6 py-4 font-semibold uppercase text-[10px]">Usuario</th>
                <th className="px-6 py-4 font-semibold uppercase text-[10px]">Acción</th>
                <th className="px-6 py-4 font-semibold uppercase text-[10px]">Módulo</th>
                <th className="px-6 py-4 font-semibold uppercase text-[10px]">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/5">
              {recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-200">
                    {/* nombre es el nombre completo (ej: Astrid Nicoll...) */}
                    <span className="block truncate max-w-[200px]">{log.nombre || "Sistema"}</span>
                    {/* usuario es el correo (ej: astrid@comisat.com) */}
                    <span className="text-[10px] text-gray-400 font-normal">{log.usuario}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge size="sm" color={getAccionColor(log.accion)} variant="light">
                      {log.accion?.toUpperCase() || "ACCIÓN"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-gray-400 dark:text-gray-500 italic text-xs capitalize">
                    {log.coleccion}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-[11px]">
                    {log.fecha?.toDate().toLocaleString("es-HN", { dateStyle: 'short', timeStyle: 'short' })}
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