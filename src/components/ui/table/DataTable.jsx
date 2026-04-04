import { createContext, useContext, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./index";

const DataTableContext = createContext(null);

const useDataTable = () => {
  const ctx = useContext(DataTableContext);
  if (!ctx) throw new Error("Usa los sub-componentes dentro de <DataTable>");
  return ctx;
};

export default function DataTable({
  data,
  columns,
  loading = false,
  children,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, pagination, columnFilters },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <DataTableContext.Provider
      value={{ table, loading, globalFilter, setGlobalFilter, setPagination }}
    >
      {children}
    </DataTableContext.Provider>
  );
}

DataTable.Toolbar = function Toolbar({
  searchPlaceholder = "Buscar...",
  children,
}) {
  const { globalFilter, setGlobalFilter, setPagination } = useDataTable();

  return (
    <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 rounded-xl mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="relative flex items-center w-full sm:flex-1 sm:min-w-[280px]">
        <svg
          className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/[0.02] border border-gray-300/70 dark:border-white/10 rounded-lg text-sm text-gray-900
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
                     dark:text-white dark:placeholder-gray-500"
        />
      </div>
      {children}
    </div>
  );
};

DataTable.NumberRangeFilter = function NumberRangeFilter({
  columnId,
  label,
  onChange,
}) {
  const { table } = useDataTable();
  const column = table.getColumn(columnId);
  const [min, max] = column?.getFilterValue() ?? [undefined, undefined];

  if (!column) return null;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
      )}
      <input
        type="number"
        min="0"
        value={min ?? ""}
        onChange={(e) => {
          const nextRange = [
            e.target.value !== "" ? Number(e.target.value) : undefined,
            max,
          ];
          column.setFilterValue(nextRange);
          onChange?.(nextRange);
        }}
        placeholder="Min"
        className="w-20 px-2 py-2 border border-gray-300/70 dark:border-white/10 rounded-lg text-sm
                   bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white"
      />
      <span className="text-gray-400 dark:text-gray-500">—</span>
      <input
        type="number"
        value={max ?? ""}
        onChange={(e) => {
          const nextRange = [
            min,
            e.target.value !== "" ? Number(e.target.value) : undefined,
          ];
          column.setFilterValue(nextRange);
          onChange?.(nextRange);
        }}
        placeholder="Max"
        className="w-20 px-2 py-2 border border-gray-300/70 dark:border-white/10 rounded-lg text-sm
                   bg-white dark:bg-white/[0.02] text-gray-900 dark:text-white"
      />
    </div>
  );
};

DataTable.Table = function TableView({
  emptyMessage = "No se encontraron resultados.",
}) {
  const { table, loading } = useDataTable();

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
      {loading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Cargando datos...
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell
                      isHeader
                      key={header.id}
                      className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 select-none"
                    >
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        style={{
                          cursor: header.column.getCanSort()
                            ? "pointer"
                            : "default",
                        }}
                        className="flex items-center gap-1"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" && " ↑"}
                        {header.column.getIsSorted() === "desc" && " ↓"}
                        {header.column.getCanSort() &&
                          !header.column.getIsSorted() && (
                            <span className="text-gray-300 dark:text-gray-600">
                              ↕
                            </span>
                          )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-5 py-4 sm:px-6 text-gray-500 text-start text-theme-sm dark:text-gray-400"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <td
                    colSpan={100}
                    className="px-5 py-10 text-center text-gray-400 italic"
                  >
                    {emptyMessage}
                  </td>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

DataTable.Pagination = function Pagination() {
  const { table } = useDataTable();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Filas por página:
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="p-1.5 border border-gray-300 rounded-md text-sm text-gray-900
                     dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size} className="bg-white text-gray-900">
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Página{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </strong>{" "}
          — {table.getFilteredRowModel().rows.length} resultados
        </span>
        <button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        >
          «
        </button>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        >
          ‹ Anterior
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        >
          Siguiente ›
        </button>
        <button
          onClick={() =>
            table.setPageIndex(Math.max(table.getPageCount() - 1, 0))
          }
          disabled={!table.getCanNextPage()}
          className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50
                     disabled:opacity-40 disabled:cursor-not-allowed
                     dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
        >
          »
        </button>
      </div>
    </div>
  );
};
