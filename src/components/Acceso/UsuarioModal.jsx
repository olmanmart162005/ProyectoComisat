import { Modal } from "../ui/modal";

export default function UsuarioModal({
  isOpen,
  onClose,
  editandoId,
  enviando,
  onSubmit,
  busquedaEmpleado,
  setBusquedaEmpleado,
  mostrarSugerencias,
  setMostrarSugerencias,
  empleados,
  setEmpleadoId,
  setNombre,
  setCorreoPersonal,
  correo,
  setCorreo,
  rolId,
  handleRolChange,
  roles,
  estado,
  setEstado,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
          {editandoId ? "Editando Usuario" : "Registrar Nuevo Usuario"}
        </h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Empleado
              </label>
              <input
                type="text"
                value={busquedaEmpleado}
                onChange={(e) => {
                  setBusquedaEmpleado(e.target.value);
                  setMostrarSugerencias(true);
                  if (!e.target.value) {
                    setEmpleadoId("");
                    setNombre("");
                    setCorreoPersonal("");
                  }
                }}
                onFocus={() => setMostrarSugerencias(true)}
                onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                placeholder="Buscar empleado..."
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />

              {mostrarSugerencias && busquedaEmpleado.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 max-h-52 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
                  {empleados
                    .filter((emp) =>
                      `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`
                        .toLowerCase()
                        .includes(busquedaEmpleado.toLowerCase()),
                    )
                    .map((emp) => {
                      const nombreCompleto = `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
                      return (
                        <li
                          key={emp.id}
                          onMouseDown={() => {
                            setEmpleadoId(emp.id);
                            setNombre(nombreCompleto);
                            setCorreoPersonal(emp.correo ?? "");
                            setBusquedaEmpleado(nombreCompleto);
                            setMostrarSugerencias(false);
                          }}
                          className="px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700"
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {nombreCompleto}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {emp.correo ?? "Sin correo"}
                          </p>
                        </li>
                      );
                    })}

                  {empleados.filter((emp) =>
                    `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`
                      .toLowerCase()
                      .includes(busquedaEmpleado.toLowerCase()),
                  ).length === 0 && (
                    <li className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center">
                      Sin resultados para "{busquedaEmpleado}"
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Rol</label>
            <select
              value={rolId}
              onChange={handleRolChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              {roles.length === 0 ? (
                <option disabled>Cargando roles...</option>
              ) : (
                roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          <div className="flex gap-3 md:col-span-2 mt-4">
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
              {enviando ? "Procesando..." : editandoId ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
