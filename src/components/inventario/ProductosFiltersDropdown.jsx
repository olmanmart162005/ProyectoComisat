import { useState } from "react";
import { Filter as FilterIcon } from "lucide-react";

import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const estados = ["Activo", "Inactivo", "Agotado"];

export default function ProductosFiltersDropdown({
  categorias,
  filtroCategoria,
  setFiltroCategoria,
  filtroEstadoProducto,
  setFiltroEstadoProducto,
  filtroStockRange,
  setFiltroStockRange,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [stockMin, stockMax] = filtroStockRange;
  const hayFiltros =
    Boolean(filtroCategoria) ||
    Boolean(filtroEstadoProducto) ||
    stockMin !== undefined ||
    stockMax !== undefined;

  const etiqueta = hayFiltros ? "Filtrando" : "Filtrar";

  const limpiarFiltros = () => {
    setFiltroCategoria("");
    setFiltroEstadoProducto("");
    setFiltroStockRange([undefined, undefined]);
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
        className="w-72 p-2"
      >
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Filtrar productos
        </div>

        <div className="px-2 pb-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Estado
          </label>
          <div className="grid grid-cols-1 gap-1">
            <DropdownItem
              onItemClick={() => {
                setFiltroEstadoProducto("");
                setIsOpen(false);
              }}
              className={
                !filtroEstadoProducto
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : ""
              }
            >
              Todos
            </DropdownItem>
            {estados.map((estado) => (
              <DropdownItem
                key={estado}
                onItemClick={() => {
                  setFiltroEstadoProducto(estado);
                  setIsOpen(false);
                }}
                className={
                  filtroEstadoProducto === estado
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : ""
                }
              >
                {estado}
              </DropdownItem>
            ))}
          </div>
        </div>

        <div className="px-2 py-2 border-t border-gray-100 dark:border-white/10 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Categoría
          </label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
          >
            <option value="" className="bg-white text-gray-900">
              Todas
            </option>
            {categorias.map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
                className="bg-white text-gray-900"
              >
                {cat.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="px-2 py-2 border-t border-gray-100 dark:border-white/10 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Stock
          </label>
          <div className="grid grid-cols-2 gap-2 items-center">
            <input
              type="number"
              min="0"
              value={stockMin ?? ""}
              onChange={(e) => {
                const nextRange = [
                  e.target.value !== "" ? Number(e.target.value) : undefined,
                  stockMax,
                ];
                setFiltroStockRange(nextRange);
              }}
              placeholder="Min"
              className="w-full px-2.5 py-2 border border-gray-300/70 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white"
            />
            <input
              type="number"
              min="0"
              value={stockMax ?? ""}
              onChange={(e) => {
                const nextRange = [
                  stockMin,
                  e.target.value !== "" ? Number(e.target.value) : undefined,
                ];
                setFiltroStockRange(nextRange);
              }}
              placeholder="Max"
              className="w-full px-2.5 py-2 border border-gray-300/70 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white"
            />
          </div>
        </div>

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
