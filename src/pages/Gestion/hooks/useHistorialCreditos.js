import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const MESES = [
  { valor: "01", etiqueta: "Enero" },
  { valor: "02", etiqueta: "Febrero" },
  { valor: "03", etiqueta: "Marzo" },
  { valor: "04", etiqueta: "Abril" },
  { valor: "05", etiqueta: "Mayo" },
  { valor: "06", etiqueta: "Junio" },
  { valor: "07", etiqueta: "Julio" },
  { valor: "08", etiqueta: "Agosto" },
  { valor: "09", etiqueta: "Septiembre" },
  { valor: "10", etiqueta: "Octubre" },
  { valor: "11", etiqueta: "Noviembre" },
  { valor: "12", etiqueta: "Diciembre" },
];

export const generarAnios = () => {
  const anioActual = new Date().getFullYear();
  const anios = [];
  for (let y = anioActual; y >= 2020; y--) {
    anios.push(String(y));
  }
  return anios;
};

export const estadoCreditoColor = {
  Activo: "success",
  Pagado: "info",
  Cancelado: "error",
  Finalizado: "warning",
};

export function useHistorialCreditos({ openModal }) {
  const now = new Date();

  const [cuotas, setCuotas] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anioFiltro, setAnioFiltro] = useState(String(now.getFullYear()));
  const [mesFiltro, setMesFiltro] = useState(String(now.getMonth() + 1).padStart(2, "0"));

  const [creditoSeleccionado, setCreditoSeleccionado] = useState(null);
  const [cuotasDelCredito, setCuotasDelCredito] = useState([]);
  const [loadingCuotas, setLoadingCuotas] = useState(false);

  const anios = useMemo(() => generarAnios(), []);
  const mesKey = `${anioFiltro}-${mesFiltro}`;

  const fetchDatos = async (key) => {
    setLoading(true);
    try {
      const [snapCuotas, snapCreditos] = await Promise.all([
        getDocs(query(collection(db, "cuotas"), where("mesCobro", "==", key))),
        getDocs(query(collection(db, "creditos"), where("mesCobro", "==", key))),
      ]);
      setCuotas(snapCuotas.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCreditos(snapCreditos.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error al cargar historial:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos(mesKey);
  }, [mesKey]);

  const handleVerCuotas = async (credito) => {
    setCreditoSeleccionado(credito);
    setCuotasDelCredito([]);
    setLoadingCuotas(true);
    openModal();
    try {
      const q = query(collection(db, "cuotas"), where("creditoId", "==", credito.id));
      const snap = await getDocs(q);
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => Number(a.numeroCuota ?? 0) - Number(b.numeroCuota ?? 0));
      setCuotasDelCredito(docs);
    } catch (err) {
      console.error("Error al cargar cuotas del crédito:", err);
    } finally {
      setLoadingCuotas(false);
    }
  };

  const { totalCuotas, montoTotal, empleadosUnicos, creditosPagados } = useMemo(() => {
    const monto = cuotas.reduce((acc, c) => acc + Number(c.montoCuota ?? 0), 0);
    const empleados = new Set(cuotas.map((c) => c.empleadoId));
    const pagados = creditos.filter((c) => String(c.estadoCredito ?? "").toLowerCase() === "pagado").length;
    return { totalCuotas: cuotas.length, montoTotal: monto, empleadosUnicos: empleados.size, creditosPagados: pagados };
  }, [cuotas, creditos]);

  return {
    cuotas,
    creditos,
    loading,
    anioFiltro,
    setAnioFiltro,
    mesFiltro,
    setMesFiltro,
    anios,
    mesKey,
    creditoSeleccionado,
    cuotasDelCredito,
    loadingCuotas,
    totalCuotas,
    montoTotal,
    empleadosUnicos,
    creditosPagados,
    handleVerCuotas,
  };
}
