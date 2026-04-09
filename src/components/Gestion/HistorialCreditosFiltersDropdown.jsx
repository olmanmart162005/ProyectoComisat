import { useState } from "react";
import { Filter as FilterIcon } from "lucide-react";

import { Dropdown } from "../../components/ui/dropdown/Dropdown";

const selectClass =
  "w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100";

export default function HistorialCreditosFiltersDropdown({
  estados,
  filtroEstado,
  setFiltroEstado,
  rangoFecha,
  setRangoFecha,
  setRangoPersonalizado,
  datePickerNode,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hayFiltros = Boolean(filtroEstado) || Boolean(rangoFecha);
  const etiqueta = hayFiltros ? "Filtrando" : "Filtrar";

  const limpiarFiltros = () => {
    setFiltroEstado("");
    setRangoFecha("");
    setRangoPersonalizado([null, null]);
  };

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
        className="w-80 p-2"
      >
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Filtrar Historial
        </div>

        <div className="px-2 pb-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Estado
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-white text-gray-900">
              Todos los estados
            </option>
            {estados.map((est) => (
              <option key={est} value={est} className="bg-white text-gray-900">
                {est}
              </option>
            ))}
          </select>
        </div>

        <div className="px-2 py-2 border-t border-gray-100 dark:border-white/10 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Fecha
          </label>
          <select
            value={rangoFecha}
            onChange={(e) => {
              setRangoFecha(e.target.value);
              if (e.target.value !== "personalizado") {
                setRangoPersonalizado([null, null]);
              }
            }}
            className={selectClass}
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
        </div>

        {rangoFecha === "personalizado" && (
          <div className="px-2 py-2 border-t border-gray-100 dark:border-white/10">
            {datePickerNode}
          </div>
        )}

        <div className="px-2 pt-2 border-t border-gray-100 dark:border-white/10 flex gap-2">
          <button
            type="button"
            onClick={limpiarFiltros}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300/70 dark:border-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
          >
            Aplicar
          </button>
        </div>
      </Dropdown>
    </div>
  );
}
