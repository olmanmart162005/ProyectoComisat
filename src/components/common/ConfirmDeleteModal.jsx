import { Modal } from "../ui/modal";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar eliminación",
  message,
  itemName,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM10.29 3.86 1.82 18.5A2.25 2.25 0 0 0 3.76 21.75h16.48a2.25 2.25 0 0 0 1.94-3.25L13.71 3.86a2.25 2.25 0 0 0-3.42 0Z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white/90">
              {title}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {message}
              {itemName ? (
                <span className="font-semibold text-gray-900 dark:text-white/90">
                  {` ${itemName}`}
                </span>
              ) : null}
              {"?"}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
