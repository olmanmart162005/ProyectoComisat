import { useState } from "react";
import Badge from "../../../components/ui/badge/Badge";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { EyeIcon, MoreDotIcon, PencilIcon, TrashBinIcon } from "../../../icons";
import {
  formatDniDisplay,
  formatTelefonoDisplay,
} from "../../../utils/empleadoUtils";
const obtenerIniciales = (texto) => {
  const limpio = String(texto ?? "").trim();
  if (!limpio) return "--";
  const partes = limpio.split(/\s+/).filter(Boolean);
  return partes
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
};
export const COLUMNAS_EXPORT_EMPLEADOS = [
  { key: "codigoEmpleado", header: "Código", type: "text" },
  {
    key: "dni",
    header: "DNI",
    type: "text",
    getValue: (row) => formatDniDisplay(row.dni),
  },
  { key: "nombres", header: "Nombres", type: "text" },
  { key: "apellidos", header: "Apellidos", type: "text" },
  { key: "correo", header: "Correo", type: "text" },
  {
    key: "telefono",
    header: "Teléfono",
    type: "text",
    getValue: (row) => formatTelefonoDisplay(row.telefono),
  },
  { key: "salario", header: "Salario", type: "currency" },
  { key: "fechaInicio", header: "Fecha Inicio", type: "date" },
  { key: "estado", header: "Estado", type: "text" },
];
function EmpleadoAcciones({ empleado, onView, onEdit, onEliminar }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
        aria-label="Abrir acciones"
      >
        <MoreDotIcon className="h-5 w-5" />
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="min-w-40 overflow-hidden"
      >
        <div className="py-1">
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onView(empleado);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <EyeIcon className="h-4 w-4" />
            Ver
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEdit(empleado);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <PencilIcon className="h-4 w-4" />
            Editar
          </DropdownItem>
          <DropdownItem
            onItemClick={() => {
              setIsOpen(false);
              onEliminar(empleado.id);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <TrashBinIcon className="h-4 w-4" />
            Eliminar
          </DropdownItem>
        </div>
      </Dropdown>
    </div>
  );
}
export function empleadoColumns({ onView, onEdit, onEliminar, departamentos }) {
  void departamentos;
  return [
    {
      accessorFn: (row) => `${row.nombres} ${row.apellidos}`,
      id: "nombreCompleto",
      header: "Empleado",
      cell: (info) => {
        const nombreCompleto = info.getValue();
        return (
          <div className="flex items-center gap-2.5">
            <div
              title={nombreCompleto}
              aria-label={nombreCompleto}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
            >
              {obtenerIniciales(nombreCompleto)}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span
                title={nombreCompleto}
                className="block max-w-[220px] truncate font-medium text-gray-800 text-theme-sm dark:text-white/90"
              >
                {nombreCompleto}
              </span>
              <span className="block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                {info.row.original.codigoEmpleado}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "contacto",
      header: "Contacto",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-gray-800 dark:text-white/90">
            {row.original.correo}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTelefonoDisplay(row.original.telefono)}
          </span>
        </div>
      ),
    },
    { accessorKey: "departamentoNombre", header: "Departamento" },
    {
      accessorKey: "salario",
      header: "Salario",
      cell: (info) => `L.${Number(info.getValue()).toLocaleString("es-HN")}`,
    },
    {
      accessorKey: "fechaInicio",
      header: "Fecha Inicio",
      cell: (info) => {
        const fecha = info.getValue();
        if (!fecha) return "-";
        try {
          const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
          return date.toLocaleDateString("es-HN");
        } catch {
          return "-";
        }
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: (info) => {
        const val = info.getValue();
        const color =
          val === "Activo"
            ? "success"
            : val === "Inactivo"
              ? "error"
              : "warning";
        return (
          <Badge size="sm" color={color}>
            {val}
          </Badge>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => (
        <EmpleadoAcciones
          empleado={row.original}
          onView={onView}
          onEdit={onEdit}
          onEliminar={onEliminar}
        />
      ),
    },
  ];
}