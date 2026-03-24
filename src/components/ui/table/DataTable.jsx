import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "./index";

export default function DataTable({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center w-full sm:w-auto">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
            className="w-full sm:w-56 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-white/5 dark:border-white/10 dark:text-white text-sm"
          />
        </div>
        <div className="flex items-center w-full sm:w-auto">
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="w-full sm:w-auto p-2 border border-gray-300 rounded-md text-sm text-gray-900 dark:bg-white/5 dark:border-white/10 dark:text-gray-100"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size} className="bg-white text-gray-900">
                {size} filas
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Cargando datos...
        </div>
      ) : (
        <>
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
                                {" "}
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
                      colSpan={columns.length}
                      className="px-5 py-10 text-center text-gray-400 italic"
                    >
                      {emptyMessage}
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 dark:border-white/5">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Página{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} de{" "}
                {table.getPageCount() || 1}
              </strong>{" "}
              — {table.getFilteredRowModel().rows.length} resultados
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
              >
                «
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
              >
                ‹ Anterior
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
              >
                Siguiente ›
              </button>
              <button
                onClick={() =>
                  table.setPageIndex(Math.max(table.getPageCount() - 1, 0))
                }
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 rounded border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
