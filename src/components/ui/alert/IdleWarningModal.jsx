import { Modal } from "../modal";
import { TimeIcon } from "../../../icons";

export function IdleWarningModal({ isOpen, onContinuar }) {
  return (
    <Modal isOpen={isOpen} onClose={onContinuar} className="max-w-sm">
      <div className="p-6 text-center space-y-4">
        <div className="flex justify-center text-blue-600 dark:text-blue-400">
          <TimeIcon className="w-10 h-10" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white/90">
          ¿Sigues ahí?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu sesión se cerrará en <strong>1 minuto</strong> por inactividad.
        </p>
        <button
          onClick={onContinuar}
          className="w-full p-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
        >
          Seguir conectado
        </button>
      </div>
    </Modal>
  );
}
