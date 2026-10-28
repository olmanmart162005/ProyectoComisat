import { createElement, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Activity, Clock3, Layers3, Users, UserRoundX, Gauge } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { db } from "../../firebase/firebase";

const COLORS = ["#176b5b", "#e29d37", "#3973a8", "#c65345", "#647c45", "#8a6e9e"];

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isEnabled(user) {
  return String(user.estado ?? "").toLowerCase() === "activo";
}

function periodStart(period, now) {
  const start = new Date(now);
  if (period === "hoy") start.setHours(0, 0, 0, 0);
  else if (period === "7dias") start.setDate(start.getDate() - 7);
  else if (period === "30dias") start.setDate(start.getDate() - 30);
  else start.setDate(1);
  return start;
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, note, icon: Icon, tone }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
        </div>
        <span className={`rounded-md p-2 ${tone}`}>{createElement(Icon, { size: 18 })}</span>
      </div>
    </section>
  );
}

export default function DashboardTecnico() {
  const [data, setData] = useState({ users: [], logs: [], requests: [] });
  const [period, setPeriod] = useState("7dias");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getDocs(collection(db, "usuarios")),
      getDocs(collection(db, "bitacora")),
      getDocs(collection(db, "solicitudes_api")),
    ])
      .then(([usersSnap, logsSnap, requestsSnap]) => {
        if (!active) return;
        setData({
          users: usersSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
          logs: logsSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
          requests: requestsSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
        });
      })
      .catch((loadError) => {
        console.error("No se pudo cargar el dashboard técnico:", loadError);
        if (active) setError("Firestore rechazó o no pudo completar la consulta. Revisa las reglas de acceso y la conexión.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const now = new Date();
  const start = periodStart(period, now);
  const enabledUsers = data.users.filter(isEnabled);
  const roles = [...new Set(enabledUsers.map((user) => user.rolNombre || "Sin rol"))].sort();
  const roleByEmail = new Map(data.users.map((user) => [String(user.correo || "").toLowerCase(), user.rolNombre || "Sin rol"]));
  const logsInPeriod = data.logs.filter((log) => {
    const date = asDate(log.fecha);
    return date && date >= start && date <= now;
  });
  const recentlyActive = new Set(
    data.logs
      .filter((log) => {
        const date = asDate(log.fecha);
        return date && now - date <= 5 * 60 * 1000 && date <= now;
      })
      .map((log) => String(log.usuario || "").toLowerCase())
      .filter(Boolean),
  ).size;
  const activeRoleData = roles.map((name) => ({
    name,
    value: enabledUsers.filter((user) => (user.rolNombre || "Sin rol") === name).length,
  }));
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const usersWithRecentAction = new Set(
    data.logs
      .filter((log) => {
        const date = asDate(log.fecha);
        return date && date >= last30Days && date <= now;
      })
      .map((log) => String(log.usuario || "").toLowerCase()),
  );
  const inactiveCount = enabledUsers.filter((user) => !usersWithRecentAction.has(String(user.correo || "").toLowerCase())).length;
  const inactivePercent = enabledUsers.length ? (inactiveCount / enabledUsers.length) * 100 : 0;

  const modules = Object.entries(logsInPeriod.reduce((counts, log) => {
    const name = log.coleccion || "Otros";
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {})).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    total: 0,
  }));
  logsInPeriod.forEach((log) => {
    const date = asDate(log.fecha);
    const actorRole = roleByEmail.get(String(log.usuario || "").toLowerCase()) || "Sin rol";
    if (date && (roleFilter === "Todos" || actorRole === roleFilter)) hourlyActivity[date.getHours()].total += 1;
  });
  const peak = Math.max(...hourlyActivity.map((item) => item.total), 0);

  const apiMetrics = Object.entries(data.requests.reduce((groups, request) => {
    const service = request.servicio || request.service || "Otro";
    const bucket = groups[service] || { total: 0, duration: 0, failures: 0 };
    const duration = Number(request.duracionMs ?? request.durationMs ?? request.duracion ?? 0);
    bucket.total += 1;
    bucket.duration += Number.isFinite(duration) ? duration : 0;
    if (["error", "fallido", "failed"].includes(String(request.estado || request.status || "").toLowerCase())) bucket.failures += 1;
    groups[service] = bucket;
    return groups;
  }, {})).map(([name, values]) => ({
    name,
    average: Math.round(values.duration / values.total),
    failures: values.failures,
    calls: values.total,
  }));

  if (loading) return <div className="flex h-72 items-center justify-center text-sm text-slate-500">Cargando indicadores técnicos...</div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Supervisión del sistema</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Dashboard técnico</h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Período
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="hoy">Hoy</option><option value="7dias">Últimos 7 días</option><option value="30dias">Últimos 30 días</option><option value="mes">Este mes</option>
          </select>
        </label>
      </header>

      {error && <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Usuarios activos · 5 min" value={recentlyActive} note="Usuarios únicos con actividad" icon={Activity} tone="bg-emerald-50 text-emerald-800" />
        <Metric label="Cuentas habilitadas" value={enabledUsers.length} note="Distribuidas por rol" icon={Users} tone="bg-sky-50 text-sky-800" />
        <Metric label="Sin actividad · 30 días" value={`${inactiveCount} · ${inactivePercent.toFixed(1)}%`} note="Sobre cuentas habilitadas" icon={UserRoundX} tone="bg-amber-50 text-amber-800" />
        <Metric label="Llamadas registradas" value={data.requests.length} note="Colección solicitudes_api" icon={Gauge} tone="bg-rose-50 text-rose-800" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Usuarios habilitados por rol" subtitle="Solo cuentas con estado Activo">
          {activeRoleData.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={activeRoleData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3}>{activeRoleData.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">No hay cuentas habilitadas disponibles.</p>}
        </Panel>
        <Panel title="Actividad por módulo" subtitle={`Operaciones de ${period === "hoy" ? "hoy" : period === "mes" ? "este mes" : `los últimos ${period === "7dias" ? "7" : "30"} días`}`}>
          {modules.length ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={modules} layout="vertical" margin={{ left: 10, right: 24 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={105} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="total" name="Operaciones" fill="#176b5b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">La bitácora no contiene operaciones en este período.</p>}
        </Panel>
        <Panel title="Horas de mayor actividad" subtitle="Filtra las operaciones por rol del usuario">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300">Hora pico: <strong>{peak ? hourlyActivity.find((item) => item.total === peak)?.hour : "Sin actividad"}</strong></span>
            <label className="flex items-center gap-2 text-xs text-slate-500">Rol<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option>Todos</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={hourlyActivity}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" name="Operaciones" fill="#3973a8" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Tiempo promedio de APIs" subtitle="Duración medida desde el navegador; incluye latencia de red">
          {apiMetrics.length ? <div className="space-y-3">{apiMetrics.map((item) => <div key={item.name} className="grid grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3 text-sm"><span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span><div className="h-3 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, item.average / Math.max(...apiMetrics.map((metric) => metric.average), 1) * 100)}%` }} /></div><span className="whitespace-nowrap text-right text-xs text-slate-600 dark:text-slate-300">{item.average} ms · {item.failures} fallos</span></div>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center"><Clock3 className="text-slate-400" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aún no hay mediciones de APIs</p><p className="max-w-sm text-xs text-slate-500">La aplicación todavía no registra llamadas en solicitudes_api. Firebase y EmailJS deben instrumentarse para habilitar este indicador.</p></div>}
        </Panel>
      </div>

      <Panel title="Actividad reciente" subtitle="Registros de bitácora; solo lectura">
        {data.logs.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><th className="py-2 pr-4">Usuario</th><th className="py-2 pr-4">Acción</th><th className="py-2 pr-4">Módulo</th><th className="py-2">Fecha</th></tr></thead><tbody>{[...data.logs].sort((a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0)).slice(0, 10).map((log) => <tr key={log.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="py-3 pr-4">{log.nombre || log.usuario || "Sistema"}</td><td className="py-3 pr-4">{log.accion || "-"}</td><td className="py-3 pr-4">{log.coleccion || "-"}</td><td className="py-3 text-slate-500">{asDate(log.fecha)?.toLocaleString("es-HN") || "-"}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-slate-500">No hay registros de auditoría disponibles.</p>}
      </Panel>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Layers3 size={14} /> La actividad de Cloud Functions no está incluida; debe consultarse en los registros de Firebase.</p>
    </div>
  );
}