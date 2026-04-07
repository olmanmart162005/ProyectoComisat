import { Modal } from "../../components/ui/modal";
import { lps } from "../../pages/Creditos/columns/pagoMensualColumns";

export default function PagoMensualConfirmModal({
  isOpen,
  onClose,
  totalCuotas,
  montoTotal,
  empleadosUnicos,
  registradoPor,
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
            Confirmar Cobro de Cuotas
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          ¿Seguro que desea realizar el cobro de las cuotas en este momento?
        </p>

        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-white/10">
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cuotas a procesar
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {totalCuotas}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Monto total
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {lps(montoTotal)}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Empleados afectados
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {empleadosUnicos}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Registrado por
            </span>
            <span className="text-sm font-bold text-gray-800 dark:text-white/90">
              {registradoPor || "Cargando..."}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 p-2 rounded-md font-bold text-sm border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 p-2 rounded-md font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            Confirmar Cobro
          </button>
        </div>
      </div>
    </Modal>
  );
}
