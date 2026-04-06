import { Modal } from "../ui/modal";

export default function DepartamentoModal({
  isOpen,
  onClose,
  editandoId,
  nombre,
  setNombre,
  enviando,
  onSubmit,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editandoId
            ? "Editando Departamento"
            : "Registrar Nuevo Departamento"}
        </h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Nombre
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del departamento"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={enviando}
              className={`flex-1 p-2 rounded-md text-white font-bold transition ${
                enviando
                  ? "bg-gray-400"
                  : editandoId
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : editandoId
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
