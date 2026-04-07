import { Modal } from "../../components/ui/modal";

export default function SolicitudDecisionConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  procesando,
  decision,
  solicitud,
  montoTexto,
}) {
  const esAprobacion = decision === "Aprobado";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              esAprobacion
                ? "bg-green-50 dark:bg-green-500/10"
                : "bg-red-50 dark:bg-red-500/10"
            }`}
          >
            <svg
              className={`w-5 h-5 ${
                esAprobacion
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={esAprobacion ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
            {esAprobacion ? "Confirmar aprobación" : "Confirmar rechazo"}
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {esAprobacion
            ? "¿Seguro que deseas aprobar esta solicitud de crédito?"
            : "¿Seguro que deseas rechazar esta solicitud de crédito?"}
        </p>

        <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50 px-4 py-3 text-sm">
          <p className="font-semibold text-gray-700 dark:text-gray-200">
            Empleado: {solicitud?.empleadoNombres}{" "}
            {solicitud?.empleadoApellidos}
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monto solicitado:{" "}
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {montoTexto}
            </span>
          </p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={procesando}
            className="flex-1 p-2 rounded-md font-bold text-sm border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={procesando}
            className={`flex-1 p-2 rounded-md font-bold text-sm text-white transition disabled:opacity-60 ${
              esAprobacion
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {procesando
              ? "Procesando..."
              : esAprobacion
                ? "Sí, aprobar"
                : "Sí, rechazar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
