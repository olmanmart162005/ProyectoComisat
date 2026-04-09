import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import PageShell from "../../components/common/PageShell";
import { useAuth } from "../../auth/AuthProvider";
import { useNombreEmpleadoActual } from "../../hooks/useNombreEmpleadoActual";
import { generarNuevoCodigo, useEmpleados } from "./hooks/useEmpleados";
import {
  DNI_LENGTH,
  TELEFONO_LENGTH,
  formatDateForInput,
  parseDateValue,
  sanitizeDigitsInput,
} from "../../utils/empleadoUtils";

export default function EmpleadoFormulario() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const nombreEmpleado = useNombreEmpleadoActual();
  const empleado = location.state?.empleado ?? null;
  const modoEdicion = Boolean(empleado);

  const {
    empleados,
    historialEmpleados,
    departamentos,
    guardarEmpleado,
    actualizarEmpleado,
  } = useEmpleados({ user, nombreEmpleado });

  const [editandoId, setEditandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [codigoEmpleado, setCodigoEmpleado] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [departamentoNombre, setDepartamentoNombre] = useState("");
  const [salario, setSalario] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [estado, setEstado] = useState("Activo");

  const fechaInicioSeleccionada = parseDateValue(fechaInicio);

  const resetFormulario = () => {
    const codigoNuevo = generarNuevoCodigo(empleados, historialEmpleados);
    setEditandoId(null);
    setCodigoEmpleado(codigoNuevo);
    setNombres("");
    setApellidos("");
    setCorreo("");
    setDni("");
    setTelefono("");
    setSalario("");
    setFechaInicio("");
    setEstado("Activo");

    if (departamentos.length > 0) {
      setDepartamentoId(departamentos[0].id);
      setDepartamentoNombre(departamentos[0].nombre || "");
    } else {
      setDepartamentoId("");
      setDepartamentoNombre("");
    }
  };

  useEffect(() => {
    if (modoEdicion && empleado) {
      setEditandoId(empleado.id || null);
      setCodigoEmpleado(empleado.codigoEmpleado || "");
      setNombres(empleado.nombres || "");
      setApellidos(empleado.apellidos || "");
      setCorreo(empleado.correo || "");
      setDni(empleado.dni || "");
      setTelefono(empleado.telefono || "");
      setDepartamentoId(empleado.departamentoId || "");
      setDepartamentoNombre(empleado.departamentoNombre || "");
      setSalario(String(empleado.salario || ""));
      setFechaInicio(formatDateForInput(empleado.fechaInicio));
      setEstado(empleado.estado || "Activo");
      return;
    }

    if (departamentos.length > 0) {
      resetFormulario();
    }
  }, [modoEdicion, empleado, departamentos, empleados, historialEmpleados]);

  const handleDepartamentoChange = (e) => {
    const selectedId = e.target.value;
    const selectedDep = departamentos.find((d) => d.id === selectedId);
    setDepartamentoId(selectedId);
    setDepartamentoNombre(selectedDep ? selectedDep.nombre || "" : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const payload = {
        codigoEmpleado,
        nombres,
        apellidos,
        correo,
        dni,
        telefono,
        departamentoId,
        departamentoNombre,
        salario,
        fechaInicio,
        estado,
        onSuccess: () => navigate("/empleados"),
      };

      if (modoEdicion) {
        await actualizarEmpleado({
          ...payload,
          editandoId,
        });
      } else {
        await guardarEmpleado(payload);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (location.pathname.endsWith("/editar") && !empleado) {
    return (
      <PageShell
        breadcrumbCurrent="Editar"
        homeLabel="Empleados"
        homePath="/empleados"
        pageTitle="Editar Empleado"
        title="Editar Empleado"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          No se encontró el empleado para editar.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      breadcrumbCurrent={modoEdicion ? "Editar" : "Nuevo"}
      homeLabel="Empleados"
      homePath="/empleados"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-gray-900/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Código de empleado
              </p>
              <p className="mt-2 text-3xl font-extrabold text-blue-700 dark:text-blue-300">
                {codigoEmpleado || "Generando..."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Estado del empleado
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={estado !== "Inactivo"}
                  onClick={() =>
                    setEstado((prev) =>
                      prev === "Inactivo" ? "Activo" : "Inactivo",
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    estado !== "Inactivo"
                      ? "bg-blue-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      estado !== "Inactivo" ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {estado !== "Inactivo" ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-5 self-stretch">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Nombres
                </label>
                <input
                  type="text"
                  required
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej. Juan"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Apellidos
                </label>
                <input
                  type="text"
                  required
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej. Pérez"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Correo
                </label>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value.trimStart())}
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  DNI
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  maxLength={DNI_LENGTH}
                  value={dni}
                  onChange={(e) =>
                    setDni(sanitizeDigitsInput(e.target.value, DNI_LENGTH))
                  }
                  placeholder="0801200103456"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Teléfono
                </label>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={TELEFONO_LENGTH}
                  value={telefono}
                  onChange={(e) =>
                    setTelefono(
                      sanitizeDigitsInput(e.target.value, TELEFONO_LENGTH),
                    )
                  }
                  placeholder="99991234"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Departamento
                </label>
                <select
                  required
                  value={departamentoId}
                  onChange={handleDepartamentoChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                >
                  {departamentos.map((dep) => (
                    <option key={dep.id} value={dep.id}>
                      {dep.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 border-t border-gray-100 pt-2 md:grid-cols-2 dark:border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-1.5 dark:border-white/10">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-12V5m0 14v-2m0-12h3m-3 0H9"
                />
              </svg>
              <h3 className="text-base font-bold text-gray-900 dark:text-white/90">
                Compensación
              </h3>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                Salario
              </label>
              <input
                type="number"
                required
                min="1"
                value={salario}
                onChange={(e) => {
                  if (e.target.value === "" || Number(e.target.value) > 0) {
                    setSalario(e.target.value);
                  }
                }}
                placeholder="15000"
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 border-b border-gray-100 pb-1.5 dark:border-white/10">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                />
              </svg>
              <h3 className="text-base font-bold text-gray-900 dark:text-white/90">
                Contratación
              </h3>
            </div>

            <div>
              <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">
                Fecha de Inicio
              </label>
              <DatePicker
                selected={fechaInicioSeleccionada}
                onChange={(date) =>
                  setFechaInicio(date ? formatDateForInput(date) : "")
                }
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:border-white/10 dark:bg-white/[0.02] dark:text-white"
                wrapperClassName="w-full"
              />
            </div>
          </div>
        </section>

        <footer className="sticky bottom-0 z-10 -mx-5 border-t border-gray-100 bg-white px-5 py-4 dark:border-white/10 dark:bg-gray-950/80 sm:-mx-6 sm:px-6">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/empleados")}
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-200 dark:hover:bg-white/5"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={enviando}
              className={`rounded-lg px-10 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] ${
                enviando
                  ? "bg-gray-400"
                  : modoEdicion
                    ? "bg-blue-700 hover:bg-blue-800"
                    : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {enviando
                ? "Procesando..."
                : modoEdicion
                  ? "Actualizar"
                  : "Guardar"}
            </button>
          </div>
        </footer>
      </form>
    </PageShell>
  );
}
