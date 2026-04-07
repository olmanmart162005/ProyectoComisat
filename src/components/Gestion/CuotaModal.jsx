import { Modal } from "../ui/modal";

// ─── Toggle ───────────────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
    />
  </button>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function CuotaModal({
  isOpen,
  onClose,
  cuotaNumero,
  setCuotaNumero,
  cuotaEstado,
  setCuotaEstado,
  enviandoCuota,
  onSubmit,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          Nueva Cuota
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Número de cuota
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={cuotaNumero}
              onChange={(e) => setCuotaNumero(e.target.value)}
              placeholder="Ej. 3"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado
              </p>
              <p className="text-xs text-gray-400">
                {cuotaEstado ? "Habilitado" : "Deshabilitado"}
              </p>
            </div>
            <Toggle checked={cuotaEstado} onChange={setCuotaEstado} />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={enviandoCuota}
              className={`flex-1 p-2 rounded-md text-white font-bold transition ${enviandoCuota ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"}`}
            >
              {enviandoCuota ? "Procesando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
