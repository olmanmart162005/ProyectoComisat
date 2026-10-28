import { createElement, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Activity, Clock3, Layers3, Users, UserRoundX, Gauge, Search, X } from "lucide-react";
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
import { useAuth } from "../../auth/AuthProvider";
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

function isLoginAction(accion) {
  const normalized = normalizeIdentity(accion);
  return ["ingreso", "primer ingreso", "inicio de sesion", "login"].includes(normalized);
}

function isLogoutAction(accion) {
  const normalized = normalizeIdentity(accion);
  return ["logout", "cierre de sesion", "salida"].includes(normalized);
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
  const [searchTerm, setSearchTerm] = useState("");
  if (!detail) return null;

  const isApi = detail.kind === "api";
  const isUser = detail.kind === "user";

  const defaultColumns = isApi
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
          ["ultimoIngreso", "Último ingreso al sistema"],
          ["fechaRegistro", "Fecha de registro"],
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

  const columns = detail.columns || defaultColumns;

  const displayValue = (row, key) => {
    const value = row[key] ?? (key === "fecha" ? row.createdAt : undefined);

    if (key === "estado") {
      const isActivo = String(value || "").toLowerCase() === "activo";
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            isActivo
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {value || "-"}
        </span>
      );
    }

    if (key === "ultimoIngreso") {
      if (!value) return "-";
      if (value === "Nunca ha ingresado") {
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
            Nunca ha ingresado
          </span>
        );
      }
      const date = asDate(value);
      return date ? date.toLocaleString("es-HN") : String(value);
    }

    if (key === "fecha" || key === "fechaRegistro" || key === "ultimaActividad") {
      if (!value) return "-";
      const date = asDate(value);
      return date ? date.toLocaleString("es-HN") : String(value);
    }

    if (key === "accion") {
      return <span className="font-medium text-slate-900 dark:text-white">{value || "-"}</span>;
    }

    if (value && typeof value === "object") return JSON.stringify(value);
    return value == null || value === "" ? "-" : String(value);
  };

  const filteredRows = searchTerm.trim()
    ? detail.rows.filter((row) => {
        const query = searchTerm.toLowerCase();
        return columns.some(([key]) => {
          const val = row[key] ?? (key === "fecha" ? row.createdAt : undefined);
          if (val == null) return false;
          if (typeof val === "object") return JSON.stringify(val).toLowerCase().includes(query);
          return String(val).toLowerCase().includes(query);
        });
      })
    : detail.rows;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="technical-detail-title"
        className="w-full max-w-5xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 id="technical-detail-title" className="font-semibold text-slate-900 dark:text-white">
              {detail.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {filteredRows.length} de {detail.rows.length} registros
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-44 rounded-md border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-56"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cerrar
            </button>
          </div>
        </header>
        <div className="max-h-[70vh] overflow-auto p-5">
          {filteredRows.length ? (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                <tr>
                  {columns.map(([key, label]) => (
                    <th key={key} className="px-3 py-2.5">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {columns.map(([key]) => (
                      <td key={key} className="max-w-xs break-words px-3 py-2.5 text-slate-700 dark:text-slate-200">
                        {displayValue(row, key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-slate-500">
              {searchTerm ? "No se encontraron registros que coincidan con la búsqueda." : "No hay registros para mostrar."}
            </div>
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
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
      </div>
      <span className={`rounded-md p-2 ${tone}`}>{createElement(Icon, { size: 18 })}</span>
    </div>
  );

  const className =
    "w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`${className} cursor-pointer transition hover:border-emerald-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
    >
      {content}
    </button>
  ) : (
    <section className={className}>{content}</section>
  );
}

export default function DashboardTecnico() {
  const { user: currentUser } = useAuth();
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
    return () => {
      active = false;
    };
  }, []);

  const now = new Date();
  const start = periodStart(period, now);
  const enabledUsers = data.users.filter(isEnabled);
  const roles = [...new Set(enabledUsers.map((user) => user.rolNombre || "Sin rol"))].sort();

  // Maps for fast and robust user matching
  const userByEmail = new Map();
  const userById = new Map();
  const userByName = new Map();

  enabledUsers.forEach((u) => {
    if (u.correo) userByEmail.set(normalizeIdentity(u.correo), u);
    if (u.id) userById.set(String(u.id), u);
    if (u.nombre) userByName.set(normalizeIdentity(u.nombre), u);
    if (u.nombreEmpleado) userByName.set(normalizeIdentity(u.nombreEmpleado), u);
    const fullName = `${u.empleadoNombres || ""} ${u.empleadoApellidos || ""}`.trim();
    if (fullName) userByName.set(normalizeIdentity(fullName), u);
  });

  const matchEnabledUser = (log) => {
    if (!log) return null;
    const logUser = normalizeIdentity(log.usuario);
    if (logUser && userByEmail.has(logUser)) return userByEmail.get(logUser);
    if (log.docId && log.coleccion === "usuarios" && userById.has(String(log.docId))) {
      return userById.get(String(log.docId));
    }
    const logName = normalizeIdentity(log.nombre);
    if (logName && userByName.has(logName)) return userByName.get(logName);
    if (logUser && userByName.has(logUser)) return userByName.get(logUser);
    return null;
  };

  const roleForLog = (identity) => {
    const matched = matchEnabledUser({ usuario: identity, nombre: identity });
    return matched?.rolNombre || "Sin rol";
  };

  // Group all logs by user ID
  const userLogsMap = new Map();
  data.logs.forEach((log) => {
    const matched = matchEnabledUser(log);
    if (matched) {
      const list = userLogsMap.get(matched.id) || [];
      list.push(log);
      userLogsMap.set(matched.id, list);
    }
  });

  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Enabled users with calculated last login and last activity
  const enabledUsersWithDetails = enabledUsers.map((user) => {
    const userLogs = userLogsMap.get(user.id) || [];

    // Find all login logs (sorted newest first)
    const loginLogs = userLogs
      .filter((log) => isLoginAction(log.accion))
      .sort((a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0));

    let ultimoIngresoStr = "Nunca ha ingresado";
    let ultimoIngresoDate = null;

    if (loginLogs.length > 0) {
      ultimoIngresoDate = asDate(loginLogs[0].fecha);
      ultimoIngresoStr = ultimoIngresoDate ? ultimoIngresoDate.toLocaleString("es-HN") : "Fecha no disponible";
    } else if (user.ultimoIngreso) {
      ultimoIngresoDate = asDate(user.ultimoIngreso);
      ultimoIngresoStr = ultimoIngresoDate ? ultimoIngresoDate.toLocaleString("es-HN") : String(user.ultimoIngreso);
    } else if (user.primerLoginHecho === false) {
      ultimoIngresoStr = "Nunca ha ingresado";
    } else if (userLogs.length > 0) {
      const latest = [...userLogs].sort(
        (a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0)
      )[0];
      const d = asDate(latest.fecha);
      ultimoIngresoStr = d ? `${d.toLocaleString("es-HN")}` : "Sin registro de ingreso";
    }

    // Latest overall activity (logins + any action)
    let ultimaActividadDate = ultimoIngresoDate;
    if (userLogs.length > 0) {
      const latestOverall = [...userLogs].sort(
        (a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0)
      )[0];
      const overallDate = asDate(latestOverall.fecha);
      if (overallDate && (!ultimaActividadDate || overallDate > ultimaActividadDate)) {
        ultimaActividadDate = overallDate;
      }
    }

    const hasActivityLast30Days = Boolean(
      ultimaActividadDate && ultimaActividadDate >= last30Days && ultimaActividadDate <= now
    );

    return {
      ...user,
      nombre: user.nombre || user.correo || "Sin nombre",
      rolNombre: user.rolNombre || "Sin rol",
      estado: user.estado || "Activo",
      ultimoIngreso: ultimoIngresoStr,
      ultimoIngresoDate,
      ultimaActividadDate,
      hasActivityLast30Days,
    };
  });

  // 1. Usuarios activos (últimos 5 min):
  // Includes current logged in user (if enabled) + any user with activity in last 5 min (including logins)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const activeUserMap = new Map();

  // Current session user
  if (currentUser?.email) {
    const currentEnabled = enabledUsersWithDetails.find(
      (u) => normalizeIdentity(u.correo) === normalizeIdentity(currentUser.email)
    );
    if (currentEnabled) {
      activeUserMap.set(currentEnabled.id, {
        id: currentEnabled.id,
        nombre: currentEnabled.nombre,
        correo: currentEnabled.correo,
        rolNombre: currentEnabled.rolNombre,
        estado: currentEnabled.estado,
        accion: "En línea (Sesión actual)",
        modulo: "Dashboard técnico",
        ultimaActividad: now,
      });
    }
  }

  // Activity logs in the last 5 minutes (both logins and operational actions)
  const recentLogs5m = data.logs
    .filter((log) => {
      const date = asDate(log.fecha);
      if (!date || date < fiveMinutesAgo || date > now) return false;
      if (isLogoutAction(log.accion)) return false;
      const logUser = normalizeIdentity(log.usuario);
      if (logUser === "sistema" || logUser === "desconocido") return false;
      return true;
    })
    .sort((a, b) => (asDate(a.fecha)?.getTime() || 0) - (asDate(b.fecha)?.getTime() || 0));

  recentLogs5m.forEach((log) => {
    const matched = matchEnabledUser(log);
    if (matched) {
      activeUserMap.set(matched.id, {
        id: matched.id,
        nombre: matched.nombre || matched.correo,
        correo: matched.correo,
        rolNombre: matched.rolNombre || "Sin rol",
        estado: matched.estado || "Activo",
        accion: log.accion || "Actividad",
        modulo: log.coleccion ? log.coleccion.charAt(0).toUpperCase() + log.coleccion.slice(1) : "General",
        ultimaActividad: asDate(log.fecha) || now,
      });
    }
  });

  const activeUsersList = Array.from(activeUserMap.values()).sort(
    (a, b) => (asDate(b.ultimaActividad)?.getTime() || 0) - (asDate(a.ultimaActividad)?.getTime() || 0)
  );
  const recentlyActive = activeUsersList.length;

  // 2. Inactive users in the last 30 days
  const inactiveUsers = enabledUsersWithDetails
    .filter((user) => !user.hasActivityLast30Days)
    .sort((a, b) => (a.ultimoIngresoDate?.getTime() || 0) - (b.ultimoIngresoDate?.getTime() || 0));
  const inactiveCount = inactiveUsers.length;

  const logsInPeriod = data.logs.filter((log) => {
    const date = asDate(log.fecha);
    return date && date >= start && date <= now;
  });

  const requestsInPeriod = data.requests.filter((request) => {
    const date = asDate(request.fecha || request.createdAt || request.timestamp);
    return date && date >= start && date <= now;
  });

  const activeRoleData = roles.map((name) => ({
    name,
    value: enabledUsers.filter((user) => (user.rolNombre || "Sin rol") === name).length,
  }));

  const modules = Object.entries(
    logsInPeriod.reduce((counts, log) => {
      const name = log.coleccion || "Otros";
      counts[name] = (counts[name] || 0) + 1;
      return counts;
    }, {})
  )
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, "0")}:00`,
    total: 0,
  }));

  logsInPeriod.forEach((log) => {
    const date = asDate(log.fecha);
    const actorRole = roleForLog(log.usuario);
    if (date && (roleFilter === "Todos" || actorRole === roleFilter)) {
      hourlyActivity[date.getHours()].total += 1;
    }
  });

  const peak = Math.max(...hourlyActivity.map((item) => item.total), 0);

  const apiMetrics = Object.entries(
    requestsInPeriod.reduce((groups, request) => {
      const service = request.servicio || request.service || "Otro";
      const bucket = groups[service] || { total: 0, duration: 0, failures: 0 };
      const duration = Number(request.duracionMs ?? request.durationMs ?? request.duracion ?? 0);
      bucket.total += 1;
      bucket.duration += Number.isFinite(duration) ? duration : 0;
      if (["error", "fallido", "failed"].includes(String(request.estado || request.status || "").toLowerCase())) {
        bucket.failures += 1;
      }
      groups[service] = bucket;
      return groups;
    }, {})
  ).map(([name, values]) => ({
    name,
    average: Math.round(values.duration / values.total),
    failures: values.failures,
    calls: values.total,
  }));

  const openDetail = (title, rows, kind, columns) => setDetail({ title, rows, kind, columns });

  if (loading) {
    return <div className="flex h-72 items-center justify-center text-sm text-slate-500">Cargando indicadores técnicos...</div>;
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Supervisión del sistema</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">Dashboard técnico</h1>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Período
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="hoy">Hoy</option>
            <option value="7dias">Últimos 7 días</option>
            <option value="30dias">Últimos 30 días</option>
            <option value="mes">Este mes</option>
          </select>
        </label>
      </header>

      {error && (
        <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* ── Cards de Indicadores Superiores (Todas con Modal Interactivo) ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Usuarios activos · 5 min"
          value={recentlyActive}
          note="Usuarios únicos · toca para ver"
          icon={Activity}
          tone="bg-emerald-50 text-emerald-800"
          onClick={() =>
            openDetail(
              "Usuarios activos (últimos 5 min)",
              activeUsersList,
              "user",
              [
                ["nombre", "Nombre"],
                ["correo", "Correo"],
                ["rolNombre", "Rol"],
                ["accion", "Última acción"],
                ["modulo", "Módulo"],
                ["ultimaActividad", "Fecha / Hora"],
              ]
            )
          }
        />
        <Metric
          label="Cuentas habilitadas"
          value={enabledUsers.length}
          note="Distribuidas por rol · toca para ver"
          icon={Users}
          tone="bg-sky-50 text-sky-800"
          onClick={() =>
            openDetail(
              "Cuentas habilitadas",
              enabledUsersWithDetails,
              "user",
              [
                ["nombre", "Nombre"],
                ["correo", "Correo"],
                ["rolNombre", "Rol"],
                ["estado", "Estado"],
                ["ultimoIngreso", "Último ingreso al sistema"],
                ["fechaRegistro", "Fecha de registro"],
              ]
            )
          }
        />
        <Metric
          label="Sin actividad · 30 días"
          value={inactiveCount}
          note="Cuentas habilitadas · toca para ver"
          icon={UserRoundX}
          tone="bg-amber-50 text-amber-800"
          onClick={() =>
            openDetail(
              "Cuentas sin actividad (más de 30 días)",
              inactiveUsers,
              "user",
              [
                ["nombre", "Nombre"],
                ["correo", "Correo"],
                ["rolNombre", "Rol"],
                ["estado", "Estado"],
                ["ultimoIngreso", "Última vez que ingresaron al sistema"],
                ["fechaRegistro", "Fecha de registro"],
              ]
            )
          }
        />
        <Metric
          label="Solicitudes API"
          value={requestsInPeriod.length}
          note="Llamadas registradas en el período"
          icon={Gauge}
          tone="bg-rose-50 text-rose-800"
          onClick={() => openDetail("Solicitudes API", requestsInPeriod, "api")}
        />
        <Metric
          label="Actividad reciente"
          value={logsInPeriod.length}
          note="Operaciones de bitácora en el período"
          icon={Activity}
          tone="bg-sky-50 text-sky-800"
          onClick={() => openDetail("Actividad reciente", logsInPeriod, "audit")}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Usuarios habilitados por rol" subtitle="Solo cuentas con estado Activo">
          {activeRoleData.length ? (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={activeRoleData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                    onClick={(event) => {
                      const name = event?.activePayload?.[0]?.payload?.name;
                      if (name) {
                        openDetail(
                          `Usuarios · ${name}`,
                          enabledUsersWithDetails.filter((user) => (user.rolNombre || "Sin rol") === name),
                          "user",
                          [
                            ["nombre", "Nombre"],
                            ["correo", "Correo"],
                            ["rolNombre", "Rol"],
                            ["estado", "Estado"],
                            ["ultimoIngreso", "Último ingreso al sistema"],
                            ["fechaRegistro", "Fecha de registro"],
                          ]
                        );
                      }
                    }}
                  >
                    {activeRoleData.map((item, index) => (
                      <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No hay cuentas habilitadas disponibles.</p>
          )}
        </Panel>

        <Panel
          title="Actividad por módulo"
          subtitle={`Operaciones de ${
            period === "hoy" ? "hoy" : period === "mes" ? "este mes" : `los últimos ${period === "7dias" ? "7" : "30"} días`
          }`}
        >
          {modules.length ? (
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart
                  data={modules}
                  layout="vertical"
                  margin={{ left: 10, right: 24 }}
                  onClick={(event) => {
                    const name = event?.activeLabel;
                    if (name) {
                      openDetail(
                        `Actividad · ${name}`,
                        logsInPeriod.filter((log) => (log.coleccion || "Otros") === name),
                        "audit"
                      );
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={105} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="total" name="Operaciones" fill="#176b5b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">La bitácora no contiene operaciones en este período.</p>
          )}
        </Panel>

        <Panel title="Horas de mayor actividad" subtitle="Filtra las operaciones por rol del usuario">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Hora pico: <strong>{peak ? hourlyActivity.find((item) => item.total === peak)?.hour : "Sin actividad"}</strong>
            </span>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Rol
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option>Todos</option>
                {roles.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                data={hourlyActivity}
                onClick={(event) => {
                  const hour = event?.activeLabel;
                  if (hour) {
                    openDetail(
                      `Actividad · ${hour}`,
                      logsInPeriod.filter((log) => {
                        const date = asDate(log.fecha);
                        const actorRole = roleForLog(log.usuario);
                        return (
                          date &&
                          `${String(date.getHours()).padStart(2, "0")}:00` === hour &&
                          (roleFilter === "Todos" || actorRole === roleFilter)
                        );
                      }),
                      "audit"
                    );
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" interval={3} tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Operaciones" fill="#3973a8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Tiempo promedio de APIs" subtitle="Duración medida desde el navegador; incluye latencia de red">
          {apiMetrics.length ? (
            <div className="space-y-3">
              {apiMetrics.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  onClick={() =>
                    openDetail(
                      `Solicitudes · ${item.name}`,
                      requestsInPeriod.filter((request) => (request.servicio || request.service || "Otro") === item.name),
                      "api"
                    )
                  }
                  className="grid w-full min-w-0 grid-cols-[minmax(90px,1fr)_2fr_auto] items-center gap-3 rounded-md p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                  <div className="h-3 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${Math.min(100, (item.average / Math.max(...apiMetrics.map((metric) => metric.average), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-right text-xs text-slate-600 dark:text-slate-300">
                    {item.average} ms · {item.failures} fallos
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-center">
              <Clock3 className="text-slate-400" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Aún no hay mediciones de APIs</p>
              <p className="max-w-sm text-xs text-slate-500">
                El dashboard registrará sus lecturas de Firestore. También se instrumentan los inicios de sesión y envíos de
                credenciales por EmailJS.
              </p>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Solicitudes de API" subtitle="Llamadas medidas en el período seleccionado">
        {requestsInPeriod.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-4">Servicio</th>
                  <th className="py-2 pr-4">Operación</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Duración</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {[...requestsInPeriod]
                  .sort(
                    (a, b) =>
                      (asDate(b.fecha || b.createdAt || b.timestamp)?.getTime() || 0) -
                      (asDate(a.fecha || a.createdAt || a.timestamp)?.getTime() || 0)
                  )
                  .slice(0, 10)
                  .map((request) => (
                    <tr
                      key={request.id}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      onClick={() => openDetail("Detalle de solicitud API", [request], "api")}
                    >
                      <td className="py-3 pr-4">{request.servicio || request.service || "Otro"}</td>
                      <td className="py-3 pr-4">{request.operacion || request.operation || "-"}</td>
                      <td className="py-3 pr-4">{request.estado || request.status || "-"}</td>
                      <td className="py-3 pr-4">{Number(request.duracionMs ?? request.durationMs ?? 0)} ms</td>
                      <td className="py-3 text-slate-500">
                        {asDate(request.fecha || request.createdAt || request.timestamp)?.toLocaleString("es-HN") || "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            Sin registros en este período. Las reglas de escritura de `solicitudes_api` deben permitir al rol técnico registrar mediciones.
          </p>
        )}
      </Panel>

      <Panel title="Actividad reciente" subtitle="Registros de bitácora; solo lectura">
        {data.logs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-2 pr-4">Usuario</th>
                  <th className="py-2 pr-4">Acción</th>
                  <th className="py-2 pr-4">Módulo</th>
                  <th className="py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {[...data.logs]
                  .sort((a, b) => (asDate(b.fecha)?.getTime() || 0) - (asDate(a.fecha)?.getTime() || 0))
                  .slice(0, 10)
                  .map((log) => (
                    <tr
                      key={log.id}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                      onClick={() => openDetail("Detalle de auditoría", [log], "audit")}
                    >
                      <td className="py-3 pr-4">{log.nombre || log.usuario || "Sistema"}</td>
                      <td className="py-3 pr-4">{log.accion || "-"}</td>
                      <td className="py-3 pr-4">{log.coleccion || "-"}</td>
                      <td className="py-3 text-slate-500">{asDate(log.fecha)?.toLocaleString("es-HN") || "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No hay registros de auditoría disponibles.</p>
        )}
      </Panel>

      {detail && <RequestDetailModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
