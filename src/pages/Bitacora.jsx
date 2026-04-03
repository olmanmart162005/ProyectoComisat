import { useEffect, useMemo, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import DataTable from "../components/ui/table/DataTable";
import Badge from "../components/ui/badge/Badge";
import MetricCard from "../components/common/MetricCard";
import { ListIcon, CheckCircleIcon, CloseIcon } from "../icons";

// ── Constantes ─────────────────────────────────────────────────────
const COLECCIONES = [
  { value: "productos", label: "Productos"  },
  { value: "empleados", label: "Empleados"  },
  { value: "creditos",  label: "Créditos"   },
];

const ACCIONES = [
  { value: "creacion",      label: "Creación"      },
  { value: "actualizacion", label: "Actualización" },
  { value: "eliminacion",   label: "Eliminación"   },
  { value: "exportar",      label: "Exportar"      },
  { value: "aprobacion",    label: "Aprobación"    },
  { value: "rechazo",       label: "Rechazo"       },
];

function accionColor(accion) {
  switch (accion) {
    case "creacion":      return "primary"; // azul
    case "actualizacion": return "success"; // verde
    case "eliminacion":   return "error";   // rojo
    case "exportar":      return "gray";    // gris o blanco
    case "aprobacion":    return "success";
    case "rechazo":       return "error";
    default:               return "gray";
  }
}

function resumirMetadata(accion, metadata = {}) {
  if (!metadata || Object.keys(metadata).length === 0) return "—";
  switch (accion) {
    case "creacion":
      return metadata.nombre ?? metadata.nombreCompleto ?? "—";
    case "actualizacion": {
      const partes = [];
      const base = metadata.nombre ?? metadata.nombreCompleto;
      if (base) partes.push(base);
      if (metadata.stockAnterior !== undefined)
        partes.push(`Stock: ${metadata.stockAnterior} → ${metadata.stockNuevo}`);
      if (metadata.estadoAnterior !== undefined)
        partes.push(`Estado: ${metadata.estadoAnterior} → ${metadata.estadoNuevo}`);
      if (metadata.salarioAnterior !== undefined)
        partes.push(`Salario: L.${metadata.salarioAnterior} → L.${metadata.salarioNuevo}`);
      if (metadata.departamentoAnterior !== undefined)
        partes.push(`Depto: ${metadata.departamentoAnterior} → ${metadata.departamentoNuevo}`);
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

// ── Componente ─────────────────────────────────────────────────────
export default function Bitacora() {
  const [registros,        setRegistros]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filtroColeccion,  setFiltroColeccion]  = useState("");
  const [filtroAccion,     setFiltroAccion]     = useState("");
  const [fechaInicio,      setFechaInicio]      = useState("");
  const [fechaFin,         setFechaFin]         = useState("");

  // Re-fetch cuando cambian los filtros que van a Firestore
  const fetchBitacora = async () => {
    setLoading(true);
    try {
      let q;

      if (filtroColeccion && filtroAccion) {
        q = query(
          collection(db, "bitacora"),
          where("coleccion", "==", filtroColeccion),
          where("accion",    "==", filtroAccion),
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
          where("accion", "==", filtroAccion),
          orderBy("fecha", "desc"),
        );
      } else {
        q = query(
          collection(db, "bitacora"),
          orderBy("fecha", "desc"),
        );
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

  // Filtro de rango de fecha en cliente (sobre los datos ya cargados)
  const registrosFiltrados = useMemo(() => {
    if (!fechaInicio && !fechaFin) return registros;
    return registros.filter((r) => {
      const fecha = r.fecha?.toDate?.();
      if (!fecha) return false;
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        if (fecha < inicio) return false;
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        if (fecha > fin) return false;
      }
      return true;
    });
  }, [registros, fechaInicio, fechaFin]);

  // Métricas calculadas sobre todos los registros cargados
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  const totalHoy = registros.filter((r) => {
    const f = r.fecha?.toDate?.();
    return f && f >= hoyInicio;
  }).length;

  const totalEliminaciones = registros.filter((r) => r.accion === "eliminacion").length;
  const totalExportaciones  = registros.filter((r) => r.accion === "exportar").length;

  const columns = useMemo(() => [
    {
      accessorKey: "fecha",
      header: "Fecha y Hora",
      cell: (info) => (
        <span className="block text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {info.getValue()?.toDate?.()?.toLocaleString("es-HN") ?? "—"}
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
  ], []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
        Bitácora de Auditoría
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <MetricCard
          title="Registros Hoy"
          value={totalHoy}
          icon={<ListIcon className="text-gray-800 size-6 dark:text-white/90" />}
          iconWrapperClass="bg-gray-100 dark:bg-gray-800"
        />
        <MetricCard
          title="Eliminaciones"
          value={totalEliminaciones}
          icon={<CloseIcon className="text-red-600 size-6 dark:text-red-400" />}
          iconWrapperClass="bg-red-50 dark:bg-red-500/10"
        />
        <MetricCard
          title="Exportaciones"
          value={totalExportaciones}
          icon={<CheckCircleIcon className="text-blue-600 size-6 dark:text-blue-400" />}
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
              <option value="" className="bg-white text-gray-900">Colección</option>
              {COLECCIONES.map((c) => (
                <option key={c.value} value={c.value} className="bg-white text-gray-900">
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className={`w-full sm:w-44 ${selectClass}`}
            >
              <option value="" className="bg-white text-gray-900">Acción</option>
              {ACCIONES.map((a) => (
                <option key={a.value} value={a.value} className="bg-white text-gray-900">
                  {a.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              title="Fecha inicio"
              className={`w-full sm:w-40 ${selectClass}`}
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              title="Fecha fin"
              className={`w-full sm:w-40 ${selectClass}`}
            />
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </div>
  );
}