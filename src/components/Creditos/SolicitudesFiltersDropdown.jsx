import { useEffect, useState } from "react";
import { Filter as FilterIcon } from "lucide-react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const estadosSolicitud = [
  { value: "", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobado_activo", label: "Activo" },
  { value: "aprobado_pagado", label: "Pagado" },
  { value: "rechazado", label: "Rechazado" },
];

export default function SolicitudesFiltersDropdown({
  filtroEstadoSolicitud,
  setFiltroEstadoSolicitud,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtroTemporal, setFiltroTemporal] = useState(filtroEstadoSolicitud);

  useEffect(() => {
    if (isOpen) {
      setFiltroTemporal(filtroEstadoSolicitud);
    }
  }, [isOpen, filtroEstadoSolicitud]);

  const hayFiltros = Boolean(filtroEstadoSolicitud);
  const etiqueta = hayFiltros ? "Filtrando" : "Filtrar";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300/70 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
      >
        <FilterIcon className="w-4 h-4" />
        <span>{etiqueta}</span>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        className="w-72 p-2"
      >
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Filtrar solicitudes
        </div>

        <div className="px-2 pb-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Estado de solicitud
          </label>

          <div className="grid grid-cols-1 gap-1">
            {estadosSolicitud.map((estado) => (
              <DropdownItem
                key={estado.value || "todos"}
                onItemClick={() => {
                  setFiltroTemporal(estado.value);
                }}
                className={
                  filtroTemporal === estado.value
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : ""
                }
              >
                {estado.label}
              </DropdownItem>
            ))}
          </div>
        </div>

        <div className="px-2 pt-2 border-t border-gray-100 dark:border-white/10 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setFiltroTemporal("");
              setFiltroEstadoSolicitud("");
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300/70 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltroEstadoSolicitud(filtroTemporal);
              setIsOpen(false);
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Aplicar
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
