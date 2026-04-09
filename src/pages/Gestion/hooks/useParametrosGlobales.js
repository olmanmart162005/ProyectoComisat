import { useEffect, useState } from "react";
import { db } from "../../../firebase/firebase";
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
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";
const CONFIG_COL = "configuracion";
const CONFIG_DOC = "creditoComisariato";
const CONFIG_WEB_DOC = "configuracionWeb";
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
export const useParametrosGlobales = ({ user, nombreEmpleado, closeModal }) => {
  const [config, setConfig] = useState(null);
  const [tiempoInactividad, setTiempoInactividad] = useState(15);
  const [porcentajeAumento, setPorcentajeAumento] = useState("");
  const [porcentajeLimite, setPorcentajeLimite] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [cuotas, setCuotas] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(true);
  const [cuotaNumero, setCuotaNumero] = useState("");
  const [cuotaEstado, setCuotaEstado] = useState(true);
  const [enviandoCuota, setEnviandoCuota] = useState(false);
  const [ultimaModificacionLabel, setUltimaModificacionLabel] = useState("");
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
        setUltimaModificacionLabel(
          data.ultimaModificacion ? formatFecha(data.ultimaModificacion) : null,
        );
      }
    } catch (e) {
      console.error(e);
      notify.loadError("la configuración");
    } finally {
      setLoadingConfig(false);
    }
  };
  const fetchConfiguracionWeb = async () => {
    try {
      const snap = await getDoc(doc(db, CONFIG_COL, CONFIG_WEB_DOC));
      if (snap.exists()) {
        setTiempoInactividad(snap.data().tiempoInactividad ?? 15);
      }
    } catch (e) {
      console.error(e);
      notify.loadError("la configuración web");
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
      notify.loadError("las cuotas");
    } finally {
      setLoadingCuotas(false);
    }
  };
  useEffect(() => {
    fetchConfig();
    fetchConfiguracionWeb();
    fetchCuotas();
  }, []);
  const handleGuardar = async () => {
    const pA = parseFloat(porcentajeAumento);
    const pL = parseFloat(porcentajeLimite);
    if (isNaN(pA) || isNaN(pL))
      return notify.warning("Ingresa valores numéricos válidos.");
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
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: CONFIG_COL,
        accion: "actualizacion",
        docId: CONFIG_DOC,
        metadata: {
          porcentajeAumento: pA / 100,
          porcentajeLimite: pL / 100,
        },
      });
      await setDoc(
        doc(db, CONFIG_COL, CONFIG_WEB_DOC),
        {
          tiempoInactividad,
          ultimaModificacion: serverTimestamp(),
        },
        { merge: true },
      );
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: CONFIG_COL,
        accion: "actualizacion",
        docId: CONFIG_WEB_DOC,
        metadata: {
          tiempoInactividad,
        },
      });
      try {
        const productosSnap = await getDocs(collection(db, "productos"));
        const nuevosPorcentaje = pA / 100;
        for (const productoDoc of productosSnap.docs) {
          const producto = productoDoc.data();
          const precioContado = parseFloat(producto.precioContado) || 0;
          const nuevoPrecioCredito = precioContado * (1 + nuevosPorcentaje);
          await updateDoc(doc(db, "productos", productoDoc.id), {
            precioCredito: parseFloat(nuevoPrecioCredito.toFixed(2)),
            ultimaModificacion: serverTimestamp(),
          });
        }
      } catch (e) {
        console.error("Error al actualizar precios de productos:", e);
      }
      await fetchConfig();
      await fetchConfiguracionWeb();
      notify.success(
        "Parámetros guardados correctamente. Precios de crédito actualizados.",
      );
    } catch (e) {
      console.error(e);
      notify.saveError("la configuración");
    } finally {
      setGuardando(false);
    }
  };
  const handleToggleCuota = async (cuota) => {
    try {
      const nuevoEstado = !cuota.estado;
      await updateDoc(doc(db, CONFIG_COL, CONFIG_DOC, "cuotas", cuota.id), {
        estado: nuevoEstado,
        ultimaModificacion: serverTimestamp(),
      });
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: `${CONFIG_COL}/cuotas`,
        accion: "actualizacion",
        docId: cuota.id,
        metadata: {
          estadoAnterior: cuota.estado ?? true,
          estadoNuevo: nuevoEstado,
        },
      });
      fetchCuotas();
    } catch (e) {
      console.error(e);
      notify.updateError("el estado de la cuota");
    }
  };
  const handleSubmitCuota = async (e) => {
    e.preventDefault();
    const meses = Number(cuotaNumero);
    if (!Number.isInteger(meses) || meses <= 0)
      return notify.warning("Ingresa un número válido.");
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
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: `${CONFIG_COL}/cuotas`,
        accion: "creacion",
        docId: String(meses),
        metadata: {
          cuota: meses,
          estado: cuotaEstado,
        },
      });
      await fetchCuotas();
      closeModal();
      notify.created("Cuota");
    } catch (e) {
      console.error(e);
      notify.saveError("la cuota");
    } finally {
      setEnviandoCuota(false);
    }
  };
  const handleEliminar = async (id) => {
    try {
      await deleteDoc(doc(db, CONFIG_COL, CONFIG_DOC, "cuotas", id));
      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado,
        coleccion: `${CONFIG_COL}/cuotas`,
        accion: "eliminacion",
        docId: id,
        metadata: {
          cuota: id,
        },
      });
      fetchCuotas();
      notify.deleted("Cuota");
    } catch (e) {
      console.error(e);
      notify.deleteError("la cuota");
    }
  };
  return {
    config,
    tiempoInactividad,
    setTiempoInactividad,
    porcentajeAumento,
    setPorcentajeAumento,
    porcentajeLimite,
    setPorcentajeLimite,
    guardando,
    loadingConfig,
    cuotas,
    loadingCuotas,
    cuotaNumero,
    setCuotaNumero,
    cuotaEstado,
    setCuotaEstado,
    enviandoCuota,
    ultimaModificacionLabel,
    handleGuardar,
    handleToggleCuota,
    handleSubmitCuota,
    handleEliminar,
  };
};