import { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import DataTable from "../../components/ui/table/DataTable";
import Badge from "../../components/ui/badge/Badge";
import MetricCard from "../../components/common/MetricCard";
import { ListIcon, TrashBinIcon, DownloadIcon } from "../../icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { safeFormatDateTime } from "../../utils/formatters";
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function accionColor(accion) {
  if (!accion) return "gray";
  const a = accion.toLowerCase();
  switch (a) {
    case "creacion":
      return "primary"; 
    case "actualizacion":
      return "success"; 
    case "eliminacion":
      return "error"; 
    case "exportar":
      return "dark"; 
    case "aprobacion":
      return "teal"; 
    case "rechazo":
      return "pink"; 
    case "primer ingreso":
      return "indigo"; 
    case "ingreso":
      return "purple"; 
    case "cobro mensual":
      return "success"; 
    default: {
      const palette = [
        "primary",
        "success",
        "error",
        "info",
        "warning",
        "purple",
        "teal",
        "pink",
        "indigo",
        "light",
        "dark",
      ];
      let hash = 0;
      for (let i = 0; i < a.length; i++)
        hash = a.charCodeAt(i) + ((hash << 5) - hash);
      const idx = Math.abs(hash) % palette.length;
      return palette[idx];
    }
  }
}
function resumirMetadata(accion, metadata = {}) {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  if (metadata.detalle) return metadata.detalle;
  switch (accion) {
    case "creacion":
      return metadata.nombre ?? metadata.nombreCompleto ?? "—";
    case "actualizacion": {
      const partes = [];
      const base = metadata.nombre ?? metadata.nombreCompleto;
      if (base) partes.push(base);
      if (metadata.stockAnterior !== undefined)
        partes.push(
          `Stock: ${metadata.stockAnterior} → ${metadata.stockNuevo}`,
        );
      if (metadata.estadoAnterior !== undefined)
        partes.push(
          `Estado: ${metadata.estadoAnterior} → ${metadata.estadoNuevo}`,
        );
      if (metadata.salarioAnterior !== undefined)
        partes.push(
          `Salario: L.${metadata.salarioAnterior} → L.${metadata.salarioNuevo}`,
        );
      if (metadata.departamentoAnterior !== undefined)
        partes.push(
          `Depto: ${metadata.departamentoAnterior} → ${metadata.departamentoNuevo}`,
        );
      return partes.join(" · ") || "—";
    }
    case "eliminacion":
      return metadata.nombre ?? metadata.nombreCompleto ?? "—";
    case "exportar":
      return `${(metadata.formato ?? "—").toUpperCase()} · ${metadata.totalRegistros ?? 0} registros`;
    case "aprobacion":
    case "rechazo":
      return metadata.empleado
        ? `${metadata.empleado}${metadata.producto ? " — " + metadata.producto : ""}`
        : "—";
    default:
      return "—";
  }
}
const selectClass =
  "p-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";
export default function Bitacora() {
  const [registros, setRegistros] = useState([]);
  const [todosLosRegistros, setTodosLosRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroColeccion, setFiltroColeccion] = useState("");
  const [filtroAccion, setFiltroAccion] = useState("");
  const [rangoFecha, setRangoFecha] = useState("");
  const [rangoPersonalizado, setRangoPersonalizado] = useState([null, null]);
  const [fechaInicioDP, fechaFinDP] = rangoPersonalizado;
  const coleccionesDinamicas = useMemo(() => {
    const set = new Set();
    todosLosRegistros.forEach((r) => {
      if (r.coleccion) set.add(r.coleccion);
    });
    return Array.from(set).map((val) => ({
      value: val,
      label: capitalize(val),
    }));
  }, [todosLosRegistros]);
  const accionesDinamicas = useMemo(() => {
    const set = new Set();
    todosLosRegistros.forEach((r) => {
      if (r.accion) set.add(r.accion.toLowerCase());
      if (r.accion) set.add(capitalize(r.accion));
    });
    const unique = Array.from(set).reduce((acc, val) => {
      if (!acc.some((v) => v.toLowerCase() === val.toLowerCase()))
        acc.push(val);
      return acc;
    }, []);
    return unique.map((val) => ({ value: val, label: capitalize(val) }));
  }, [todosLosRegistros]);
  const fetchBitacora = async () => {
    setLoading(true);
    try {
      const qCompleta = query(
        collection(db, "bitacora"),
        orderBy("fecha", "desc"),
      );
      const snapCompleta = await getDocs(qCompleta);
      const todos = snapCompleta.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTodosLosRegistros(todos);
      let q;
      const filtroAccionLower = filtroAccion ? filtroAccion.toLowerCase() : "";
      const filtroAccionCap = filtroAccion ? capitalize(filtroAccionLower) : "";
      if (filtroColeccion && filtroAccion) {
        q = query(
          collection(db, "bitacora"),
          where("coleccion", "==", filtroColeccion),
          where("accion", "in", [filtroAccionLower, filtroAccionCap]),
          orderBy("fecha", "desc"),
        );
      } else if (filtroColeccion) {
        q = query(
          collection(db, "bitacora"),
          where("coleccion", "==", filtroColeccion),
          orderBy("fecha", "desc"),
        );
      } else if (filtroAccion) {
        q = query(
          collection(db, "bitacora"),
          where("accion", "in", [filtroAccionLower, filtroAccionCap]),
          orderBy("fecha", "desc"),
        );
      } else {
        setRegistros(todos);
        return;
      }
      const snap = await getDocs(q);
      setRegistros(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar bitácora:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBitacora();
  }, [filtroColeccion, filtroAccion]);
  const limitesFecha = useMemo(() => {
    const hoy = new Date();
    switch (rangoFecha) {
      case "hoy": {
        const inicio = new Date(hoy);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "semana": {
        const inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "mes": {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "anio": {
        const inicio = new Date(hoy.getFullYear(), 0, 1);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(hoy);
        fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      case "personalizado": {
        const inicio = fechaInicioDP ? new Date(fechaInicioDP) : null;
        if (inicio) inicio.setHours(0, 0, 0, 0);
        const fin = fechaFinDP ? new Date(fechaFinDP) : null;
        if (fin) fin.setHours(23, 59, 59, 999);
        return { inicio, fin };
      }
      default:
        return { inicio: null, fin: null };
    }
  }, [rangoFecha, fechaInicioDP, fechaFinDP]);
  const registrosFiltrados = useMemo(() => {
    const { inicio, fin } = limitesFecha;
    if (!inicio && !fin) return registros;
    return registros.filter((r) => {
      const fecha = r.fecha?.toDate?.();
      if (!fecha) return false;
      if (inicio && fecha < inicio) return false;
      if (fin && fecha > fin) return false;
      return true;
    });
  }, [registros, limitesFecha]);
  const hoyInicio = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const totalHoy = useMemo(
    () =>
      todosLosRegistros.filter((r) => {
        const f = r.fecha?.toDate?.();
        return f && f >= hoyInicio;
      }).length,
    [todosLosRegistros, hoyInicio],
  );
  const totalEliminaciones = useMemo(() => {
    return todosLosRegistros.filter((r) => r.accion === "eliminacion").length;
  }, [todosLosRegistros]);
  const totalExportaciones = useMemo(() => {
    return todosLosRegistros.filter((r) => r.accion === "exportar").length;
  }, [todosLosRegistros]);
  const columns = useMemo(
    () => [
      {
        accessorKey: "fecha",
        header: "Fecha y Hora",
        cell: (info) => (
          <span className="block text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {safeFormatDateTime(info.getValue())}
          </span>
        ),
      },
      {
        accessorKey: "usuario",
        header: "Usuario",
        cell: (info) => (
          <span className="block text-xs text-gray-600 dark:text-gray-400">
            {info.getValue() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "nombre",
        header: "Nombre",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {info.getValue() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "coleccion",
        header: "Colección",
        cell: (info) => (
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90 capitalize">
            {info.getValue() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "accion",
        header: "Acción",
        cell: (info) => {
          const val = info.getValue();
          const label = val ? val.charAt(0).toUpperCase() + val.slice(1) : "";
          return (
            <Badge size="sm" color={accionColor(val)} rounded>
              {label}
            </Badge>
          );
        },
      },
      {
        id: "detalle",
        header: "Detalle",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
            {resumirMetadata(row.original.accion, row.original.metadata)}
          </span>
        ),
      },
    ],
    [],
  );
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Bitácora de Auditoría
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Registros Hoy"
          value={totalHoy}
          icon={
            <ListIcon className="text-gray-800 size-6 dark:text-white/90" />
          }
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Eliminaciones"
          value={totalEliminaciones}
          icon={
            <TrashBinIcon className="text-red-600 size-6 dark:text-red-400" />
          }
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Exportaciones"
          value={totalExportaciones}
          icon={
            <DownloadIcon className="text-blue-600 size-6 dark:text-blue-400" />
          }
          iconWrapperClass="bg-blue-50 dark:bg-blue-500/10"
        />
      </div>
      <DataTable columns={columns} data={registrosFiltrados} loading={loading}>
        <DataTable.Toolbar searchPlaceholder="Buscar por usuario o nombre...">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto flex-wrap">
            <select
              value={filtroColeccion}
              onChange={(e) => setFiltroColeccion(e.target.value)}
              className={`w-full sm:w-44 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Colección
              </option>
              {coleccionesDinamicas.map((c) => (
                <option
                  key={c.value}
                  value={c.value}
                  className="bg-white text-gray-900"
                >
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className={`w-full sm:w-44 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Acción
              </option>
              {accionesDinamicas.map((a) => (
                <option
                  key={a.value}
                  value={a.value}
                  className="bg-white text-gray-900"
                >
                  {a.label}
                </option>
              ))}
            </select>
            <select
              value={rangoFecha}
              onChange={(e) => {
                setRangoFecha(e.target.value);
                if (e.target.value !== "personalizado") {
                  setRangoPersonalizado([null, null]);
                }
              }}
              className={`w-full sm:w-48 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">
                Todas las fechas
              </option>
              <option value="hoy" className="bg-white text-gray-900">
                Hoy
              </option>
              <option value="semana" className="bg-white text-gray-900">
                Últimos 7 días
              </option>
              <option value="mes" className="bg-white text-gray-900">
                Este mes
              </option>
              <option value="anio" className="bg-white text-gray-900">
                Este año
              </option>
              <option value="personalizado" className="bg-white text-gray-900">
                Personalizado
              </option>
            </select>
            {/* Date picker de rango — solo en personalizado */}
            {rangoFecha === "personalizado" && (
              <DatePicker
                selectsRange
                startDate={fechaInicioDP}
                endDate={fechaFinDP}
                onChange={(rango) => setRangoPersonalizado(rango)}
                placeholderText="Seleccionar rango"
                dateFormat="dd/MM/yyyy"
                locale="es"
                isClearable
                className={`w-full sm:w-56 ${selectClass}`}
                wrapperClassName="w-full sm:w-auto"
              />
            )}
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}