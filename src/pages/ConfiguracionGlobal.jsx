import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useModal } from "../hooks/useModal";
import { Modal } from "../components/ui/modal";
import {
  CreditPercentIcon,
  PercentIcon,
  SavePlusIcon,
  TrashBinIcon,
} from "../icons";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatFecha = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("es-HN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const CONFIG_COL = "configuracion";
const CONFIG_DOC = "creditoComisariato";

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParametrosGlobales() {
  const [config, setConfig] = useState(null);
  const [porcentajeAumento, setPorcentajeAumento] = useState("");
  const [porcentajeLimite, setPorcentajeLimite] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [cuotas, setCuotas] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(true);
  const [cuotaNumero, setCuotaNumero] = useState("");
  const [cuotaEstado, setCuotaEstado] = useState(true);
  const [enviandoCuota, setEnviandoCuota] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_DOC));
      if (snap.exists()) {
        const data = snap.data();
        setConfig(data);
        setPorcentajeAumento(
          data.porcentajeAumento !== undefined
            ? (data.porcentajeAumento * 100).toFixed(2)
            : "",
        );
        setPorcentajeLimite(
          data.porcentajeLimite !== undefined
            ? (data.porcentajeLimite * 100).toFixed(2)
            : "",
        );
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la configuración.");
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchCuotas = async () => {
    setLoadingCuotas(true);
    try {
      const snap = await getDocs(
        collection(db, CONFIG_COL, CONFIG_DOC, "cuotas"),
      );
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.id) - Number(b.id));
      setCuotas(docs);
    } catch (e) {
      console.error(e);
      alert("No se pudieron cargar las cuotas.");
    } finally {
      setLoadingCuotas(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchCuotas();
  }, []);

  const handleGuardar = async () => {
    const pA = parseFloat(porcentajeAumento);
    const pL = parseFloat(porcentajeLimite);
    if (isNaN(pA) || isNaN(pL))
      return alert("Ingresa valores numéricos válidos.");
    setGuardando(true);
    try {
      await setDoc(
        doc(db, CONFIG_COL, CONFIG_DOC),
        {
          porcentajeAumento: pA / 100,
          porcentajeLimite: pL / 100,
          fechaRegistro: config?.fechaRegistro ?? serverTimestamp(),
          ultimaModificacion: serverTimestamp(),
        },
        { merge: true },
      );

      // Actualizar precios de crédito en todos los productos
      try {
        const productosSnap = await getDocs(collection(db, "productos"));
        const nuevosPorcentaje = pA / 100;

        for (const productoDoc of productosSnap.docs) {
          const producto = productoDoc.data();
          const precioContado = parseFloat(producto.precioContado) || 0;
          const nuevoPrecioCredito = precioContado * (1 + nuevosPorcentaje);

          await updateDoc(doc(db, "productos", productoDoc.id), {
            precioCredito: parseFloat(nuevoPrecioCredito.toFixed(2)),
            ultima_modificacion: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Error al actualizar precios de productos:", e);
      }

      await fetchConfig();
      alert(
        "Parámetros guardados correctamente. Precios de crédito actualizados.",
      );
    } catch (e) {
      console.error(e);
      alert("Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleCuota = async (cuota) => {
    try {
      await updateDoc(doc(db, CONFIG_COL, CONFIG_DOC, "cuotas", cuota.id), {
        estado: !cuota.estado,
        ultimaModificacion: serverTimestamp(),
      });
      fetchCuotas();
    } catch (e) {
      console.error(e);
      alert("Error al cambiar estado.");
    }
  };

  const handleSubmitCuota = async (e) => {
    e.preventDefault();
    const meses = Number(cuotaNumero);
    if (!Number.isInteger(meses) || meses <= 0)
      return alert("Ingresa un número válido.");
    setEnviandoCuota(true);
    try {
      await setDoc(
        doc(db, CONFIG_COL, CONFIG_DOC, "cuotas", String(meses)),
        {
          estado: cuotaEstado,
          fechaRegistro: serverTimestamp(),
          ultimaModificacion: serverTimestamp(),
        },
        { merge: true },
      );
      await fetchCuotas();
      closeModal();
    } catch (e) {
      console.error(e);
      alert("Error al guardar la cuota.");
    } finally {
      setEnviandoCuota(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta cuota?")) return;
    try {
      await deleteDoc(doc(db, CONFIG_COL, CONFIG_DOC, "cuotas", id));
      fetchCuotas();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar.");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            Configuraciones globales
          </h2>
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Configure las reglas de negocio críticas para el sistema de
            comisariato.
          </p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando || loadingConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-colors shrink-0"
        >
          <span className="text-white font-bold">+</span>
          {guardando ? "Guardando..." : "Guardar Parámetros"}
        </button>
      </div>

      {/* Reglas de negocio */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          {config?.ultimaModificacion && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              Última actualización: {formatFecha(config.ultimaModificacion)}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Margen */}
          <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-brand-600 dark:text-blue-400 shrink-0">
                <PercentIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Margen de Crédito sobre Precios
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Porcentaje que se suma al precio de contado para ventas a
                  crédito.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Incremento en precio
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentajeAumento}
                onChange={(e) => setPorcentajeAumento(e.target.value)}
                disabled={loadingConfig}
                className="w-28 px-3 py-1.5 text-xl font-bold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              />
              <span className="text-xl font-bold text-gray-400">%</span>
            </div>
          </div>

          {/* Límite */}
          <div className="rounded-lg border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50 dark:bg-green-500/10 text-success-600 dark:text-green-400 shrink-0">
                <CreditPercentIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Límite de Crédito Global
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Cupo máximo de compra mensual basado en el sueldo del
                  empleado.
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              % del salario mensual
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentajeLimite}
                onChange={(e) => setPorcentajeLimite(e.target.value)}
                disabled={loadingConfig}
                className="w-28 px-3 py-1.5 text-xl font-bold rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] text-gray-800 dark:text-white/90 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              />
              <span className="text-xl font-bold text-gray-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cuotas */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80">
              Cuotas habilitadas
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Configure las cuotas disponibles para los empleados.
            </p>
          </div>
          <button
            onClick={() => {
              setCuotaNumero("");
              setCuotaEstado(true);
              openModal();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-500 text-brand-600 dark:text-brand-400 font-semibold text-sm hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          >
            <span className="text-brand-600 dark:text-brand-400 font-bold">
              +
            </span>{" "}
            Agregar Cuota
          </button>
        </div>

        <div className="rounded-lg border border-gray-100 dark:border-white/[0.05] overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_60px] px-4 py-2.5 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cuota
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Estado
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              Acción
            </span>
          </div>

          {loadingCuotas ? (
            <p className="py-8 text-center text-theme-sm text-gray-400">
              Cargando...
            </p>
          ) : cuotas.length === 0 ? (
            <p className="py-8 text-center text-theme-sm text-gray-400">
              No hay cuotas configuradas.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {cuotas.map((cuota) => (
                <div
                  key={cuota.id}
                  className="grid grid-cols-[1fr_100px_60px] px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="font-medium text-gray-800 dark:text-white/90 text-theme-sm">
                    {cuota.nombre || `${cuota.id}`}
                  </span>
                  <div className="flex justify-center">
                    <Toggle
                      checked={cuota.estado ?? true}
                      onChange={() => handleToggleCuota(cuota)}
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleEliminar(cuota.id)}
                      className="text-gray-400 hover:text-error-500 dark:hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <TrashBinIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white/90">
            Nueva Cuota
          </h2>
          <form onSubmit={handleSubmitCuota} className="space-y-4">
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
    </div>
  );
}
