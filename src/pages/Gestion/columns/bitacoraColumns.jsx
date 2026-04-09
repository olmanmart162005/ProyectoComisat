import Badge from "../../../components/ui/badge/Badge";
import { safeFormatDateTime } from "../../../utils/formatters";
import { capitalize } from "../hooks/useBitacora";
export const COLUMNAS_EXPORT_BITACORA = [
  {
    key: "fecha",
    header: "Fecha y Hora",
    type: "text",
    getValue: (row) => safeFormatDateTime(row.fecha),
  },
  {
    key: "usuario",
    header: "Usuario",
    type: "text",
  },
  {
    key: "nombre",
    header: "Nombre",
    type: "text",
  },
  {
    key: "coleccion",
    header: "Colección",
    type: "text",
    getValue: (row) => capitalize(row.coleccion) || "—",
  },
  {
    key: "accion",
    header: "Acción",
    type: "text",
    getValue: (row) => capitalize(row.accion) || "—",
  },
  {
    key: "detalle",
    header: "Detalle",
    type: "text",
    getValue: (row) => resumirMetadata(row.accion, row.metadata),
  },
];
export function accionColor(accion) {
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
export function bitacoraColumns() {
  return [
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
        const label = val ? capitalize(val) : "";
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
  ];
}