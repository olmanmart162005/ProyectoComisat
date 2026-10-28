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
import { medirSolicitudApi } from "../../services/solicitudesApi";

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

function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function userIdentities(user) {
  return [
    user.correo,
    user.nombre,
    user.nombreEmpleado,
    `${user.empleadoNombres || ""} ${user.empleadoApellidos || ""}`,
  ].map(normalizeIdentity).filter(Boolean);
}

function isFunctionalActivity(log) {
  const action = normalizeIdentity(log.accion);
  return !["ingreso", "primer ingreso", "inicio de sesion", "login", "logout", "cierre de sesion"].includes(action);
}

function periodStart(period, now) {
  const start = new Date(now);
  if (period === "hoy") start.setHours(0, 0, 0, 0);
  else if (period === "7dias") start.setDate(start.getDate() - 7);
  else if (period === "30dias") start.setDate(start.getDate() - 30);
  else start.setDate(1);
  return start;
}

function RequestDetailModal({ detail, onClose }) {
  if (!detail) return null;
  const isApi = detail.kind === "api";
  const isUser = detail.kind === "user";
  const columns = isApi
    ? [
        ["fecha", "Fecha"],
        ["usuario", "Usuario"],
        ["servicio", "Servicio"],
        ["operacion", "Operación"],
        ["duracionMs", "Duración (ms)"],
        ["estado", "Estado"],
        ["codigoError", "Código de error"],
      ]
    : isUser
      ? [
          ["nombre", "Nombre"],
          ["correo", "Correo"],
          ["rolNombre", "Rol"],
          ["estado", "Estado"],
        ]
      : [
        ["fecha", "Fecha"],
        ["usuario", "Usuario"],
        ["nombre", "Nombre"],
        ["accion", "Acción"],
        ["coleccion", "Módulo"],
        ["docId", "Documento"],
        ["metadata", "Información adicional"],
      ];
  const displayValue = (row, key) => {
    const value = row[key] ?? (key === "fecha" ? row.createdAt : undefined);
    if (key === "fecha") return asDate(value)?.toLocaleString("es-HN") || "-";
    if (value && typeof value === "object") return JSON.stringify(value);
    return value == null || value === "" ? "-" : String(value);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="technical-detail-title" className="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="technical-detail-title" className="font-semibold text-slate-900 dark:text-white">{detail.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{detail.rows.length} registros</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cerrar</button>
        </header>
        <div className="max-h-[70vh] overflow-auto p-5">
          {detail.rows.length ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr>{columns.map(([key, label]) => <th key={key} className="px-3 py-2">{label}</th>)}</tr>
              </thead>
              <tbody>
                {detail.rows.map((row, index) => (
                  <tr key={row.id || index} className="border-b border-slate-100 dark:border-slate-800">
                    {columns.map(([key]) => <td key={key} className="max-w-xs break-words px-3 py-2 text-slate-700 dark:text-slate-200">{displayValue(row, key)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-10 text-center text-sm text-slate-500">No hay registros para mostrar.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, note, icon: Icon, tone, onClick }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
        </div>
        <span className={`rounded-md p-2 ${tone}`}>{createElement(Icon, { size: 18 })}</span>
      </div>
    </>
  );

  const className = "w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900";
  return onClick
    ? <button type="button" onClick={onClick} className={`${className} transition hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500`}>{content}</button>
    : <section className={className}>{content}</section>;
}

export default function DashboardTecnico() {
  const [data, setData] = useState({ users: [], logs: [], requests: [] });
  const [period, setPeriod] = useState("7dias");
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let active = true;
    const failures = [];
    const readCollection = async (name, operation, track = true) => {
      try {
        const read = () => getDocs(collection(db, name));
        return await (track
          ? medirSolicitudApi({ servicio: "Firestore", operacion: operation }, read)
          : read());
      } catch (loadError) {
        console.error(`No se pudo leer ${name}:`, loadError);
        failures.push(name);
        return null;
      }
    };

    const fetchData = async () => {
      try {
        const [usersSnap, logsSnap] = await Promise.all([
          readCollection("usuarios", "dashboard_tecnico_usuarios"),
          readCollection("bitacora", "dashboard_tecnico_bitacora"),
        ]);
        const requestsSnap = await readCollection("solicitudes_api", "", false);
        if (!active) return;
        setData({
          users: usersSnap?.docs.map((item) => ({ id: item.id, ...item.data() })) || [],
          logs: logsSnap?.docs.map((item) => ({ id: item.id, ...item.data() })) || [],
          requests: requestsSnap?.docs.map((item) => ({ id: item.id, ...item.data() })) || [],
        });
        if (failures.length) {
          setError(`No se pudieron consultar: ${failures.join(", ")}. Verifica las reglas de Firestore y los permisos del rol.`);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []);

  const now = new Date();
  const start = periodStart(period, now);
  const enabledUsers = data.users.filter(isEnabled);
  const roles = [...new Set(enabledUsers.map((user) => user.rolNombre || "Sin rol"))].sort();
    const buildIdentityMap = (accounts) => {
      const identityMap = new Map();
      accounts.forEach((user) => {
        const account = { id: user.id, email: normalizeIdentity(user.correo), role: user.rolNombre || "Sin rol" };
        userIdentities(user).forEach((identity) => {
          const matches = identityMap.get(identity) || new Map();
          matches.set(account.email || account.id, account);
          identityMap.set(identity, matches);
        });
      });
      return identityMap;
    };
    const accountByIdentity = buildIdentityMap(data.users);
    const enabledAccountByIdentity = buildIdentityMap(enabledUsers);
    const resolveAccount = (identityMap, value) => {
      const matches = identityMap.get(normalizeIdentity(value));
      return matches?.size === 1 ? matches.values().next().value : null;
    };
    const roleForLog = (identity) => resolveAccount(accountByIdentity, identity)?.role || "Sin rol";
  const logsInPeriod = data.logs.filter((log) => {
    const date = asDate(log.fecha);
    return date && date >= start && date <= now;
  });
  const requestsInPeriod = data.requests.filter((request) => {
    const date = asDate(request.fecha || request.createdAt || request.timestamp);
    return date && date >= start && date <= now;
  });
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const recentlyActive = new Set(
    data.logs
      .filter((log) => {
        const date = asDate(log.fecha);
        return date && date >= fiveMinutesAgo && date <= now && isFunctionalActivity(log);
      })
      .map((log) => resolveAccount(enabledAccountByIdentity, log.usuario)?.email)
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
        return date && date >= last30Days && date <= now && isFunctionalActivity(log);
      })
      .map((log) => resolveAccount(enabledAccountByIdentity, log.usuario)?.email)
      .filter(Boolean),
  );
  const inactiveUsers = enabledUsers.filter((user) => !usersWithRecentAction.has(normalizeIdentity(user.correo)));
  const inactiveCount = inactiveUsers.length;

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
    const actorRole = roleForLog(log.usuario);
    if (date && (roleFilter === "Todos" || actorRole === roleFilter)) hourlyActivity[date.getHours()].total += 1;
  });
  const peak = Math.max(...hourlyActivity.map((item) => item.total), 0);

  const apiMetrics = Object.entries(requestsInPeriod.reduce((groups, request) => {
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
  const openDetail = (title, rows, kind) => setDetail({ title, rows, kind });

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Usuarios activos · 5 min" value={recentlyActive} note="Usuarios únicos con actividad" icon={Activity} tone="bg-emerald-50 text-emerald-800" />
        <Metric label="Cuentas habilitadas" value={enabledUsers.length} note="Distribuidas por rol" icon={Users} tone="bg-sky-50 text-sky-800" />
        <Metric label="Sin actividad · 30 días" value={inactiveCount} note="Cuentas habilitadas · toca para ver" icon={UserRoundX} tone="bg-amber-50 text-amber-800" onClick={() => openDetail("Cuentas sin actividad · 30 días", inactiveUsers, "user")} />
        <Metric label="Solicitudes API" value={requestsInPeriod.length} note="Llamadas registradas en el período" icon={Gauge} tone="bg-rose-50 text-rose-800" onClick={() => openDetail("Solicitudes API", requestsInPeriod, "api")} />
        <Metric label="Actividad reciente" value={logsInPeriod.length} note="Operaciones de bitácora en el período" icon={Activity} tone="bg-sky-50 text-sky-800" onClick={() => openDetail("Actividad reciente", logsInPeriod, "audit")} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Usuarios habilitados por rol" subtitle="Solo cuentas con estado Activo">
          {activeRoleData.length ? <div className="h-72 w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><PieChart><Pie data={activeRoleData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3} onClick={(event) => { const name = event?.activePayload?.[0]?.payload?.name; if (name) openDetail(`Usuarios · ${name}`, enabledUsers.filter((user) => (user.rolNombre || "Sin rol") === name), "user"); }}>{activeRoleData.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">No hay cuentas habilitadas disponibles.</p>}
        </Panel>
        <Panel title="Actividad por módulo" subtitle={`Operaciones de ${period === "hoy" ? "hoy" : period === "mes" ? "este mes" : `los últimos ${period === "7dias" ? "7" : "30"} días`}`}>
          {modules.length ? <div className="h-72 w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><BarChart data={modules} layout="vertical" margin={{ left: 10, right: 24 }} onClick={(event) => { const name = event?.activeLabel; if (name) openDetail(`Actividad · ${name}`, logsInPeriod.filter((log) => (log.coleccion || "Otros") === name), "audit"); }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" allowDecimals={false} /><YAxis dataKey="name" type="category" width={105} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="total" name="Operaciones" fill="#176b5b" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-slate-500">La bitácora no contiene operaciones en este período.</p>}
        </Panel>
        <Panel title="Horas de mayor actividad" subtitle="Filtra las operaciones por rol del usuario">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300">Hora pico: <strong>{peak ? hourlyActivity.find((item) => item.total === peak)?.hour : "Sin actividad"}</strong></span>
            <label className="flex items-center gap-2 text-xs text-slate-500">Rol<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option>Todos</option>{roles.map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <div className="h-64 w-full min-w-0"><ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}><BarChart data={hourlyActivity} onClick={(event) => { const hour = event?.activeLabel; if (hour) openDetail(`Actividad · ${hour}`, logsInPeriod.filter((log) => { const date = asDate(log.fecha); const actorRole = roleForLog(log.usuario); return date && `${String(date.getHours()).padStart(2, "0")}:00` === hour && (roleFilter === "Todos" || actorRole === roleFilter); }), "audit"); }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" name="Operaciones" fill="#3973a8" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Tiempo promedio de APIs" subtitle="Duración medida desde el navegador; incluye latencia de red">
          {apiMetrics.length ? <div className="space-y-3">{apiMetrics.map((item) => <button type="button" key={item.name} onClick={() => openDetail(`Solicitudes · ${item.name}`, requestsInPeriod.filter((request) => (request.servicio || request.service || "Otro") === item.name), "api")} className="grid w-full min-w-0 grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span><div className="h-3 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800"><div className="h-full bg-amber-500" style={{ width: `${Math.min(100, item.average / Math.max(...apiMetrics.map((metric) => metric.average), 1) * 100)}%` }} /></div><span className="whitespace-nowrap text-right text-xs text-slate-600 dark:text-slate-300">{item.average} ms · {item.failures} fallos</span></button>)}</div> : <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center"><Clock3 className="text-slate-400" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aún no hay mediciones de APIs</p><p className="max-w-sm text-xs text-slate-500">El dashboard registrará sus lecturas de Firestore. También se instrumentan los inicios de sesión y envíos de credenciales por EmailJS.</p></div>}
        </Panel>
      </div>

      <Panel title="Solicitudes de API" subtitle="Llamadas medidas en el período seleccionado">
        {requestsInPeriod.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><th className="py-2 pr-4">Servicio</th><th className="py-2 pr-4">Operación</th><th className="py-2 pr-4">Estado</th><th className="py-2 pr-4">Duración</th><th className="py-2">Fecha</th></tr></thead><tbody>{[...requestsInPeriod].sort((a, b) => (asDate(b.fecha || b.createdAt || b.timestamp)?.getTime() || 0) - (asDate(a.fecha || a.createdAt || a.timestamp)?.getTime() || 0)).slice(0, 10).map((request) => <tr key={request.id} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800" onClick={() => openDetail("Detalle de solicitud API", [request], "api")}><td className="py-3 pr-4">{request.servicio || request.service || "Otro"}</td><td className="py-3 pr-4">{request.operacion || request.operation || "-"}</td><td className="py-3 pr-4">{request.estado || request.status || "-"}</td><td className="py-3 pr-4">{Number(request.duracionMs ?? request.durationMs ?? 0)} ms</td><td className="py-3 text-slate-500">{asDate(request.fecha || request.createdAt || request.timestamp)?.toLocaleString("es-HN") || "-"}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-slate-500">Sin registros en este período. Las reglas de escritura de `solicitudes_api` deben permitir al rol técnico registrar mediciones.</p>}
      </Panel>

      <Panel title="Actividad reciente" subtitle="Registros de bitácora; solo lectura">
        {data.logs.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800"><th className="py-2 pr-4">Usuario</th><th className="py-2 pr-4">Acción</th><th className="py-2 pr-4">Módulo</th><th className="py-2">Fecha</th></tr></thead><tbody>{[...data.logs].sort((a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0)).slice(0, 10).map((log) => <tr key={log.id} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800" onClick={() => openDetail("Detalle de auditoría", [log], "audit")}><td className="py-3 pr-4">{log.nombre || log.usuario || "Sistema"}</td><td className="py-3 pr-4">{log.accion || "-"}</td><td className="py-3 pr-4">{log.coleccion || "-"}</td><td className="py-3 text-slate-500">{asDate(log.fecha)?.toLocaleString("es-HN") || "-"}</td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-slate-500">No hay registros de auditoría disponibles.</p>}
      </Panel>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Layers3 size={14} /> La actividad de Cloud Functions no está incluida; debe consultarse en los registros de Firebase.</p>
      {detail && <RequestDetailModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}