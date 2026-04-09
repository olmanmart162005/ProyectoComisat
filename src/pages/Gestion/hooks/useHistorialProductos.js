import { useEffect, useMemo, useState } from "react";
import { db } from "../../../firebase/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
export function useHistorialProductos() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "historialProductos"),
        orderBy("fechaBaja", "desc"),
      );
      const snap = await getDocs(q);
      setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error al cargar historial de productos:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchHistorial();
  }, []);
  const categorias = useMemo(() => {
    const cats = new Set(
      historial.map((h) => h.categoriaNombre).filter(Boolean),
    );
    return Array.from(cats).sort();
  }, [historial]);
  const historialFiltrado = useMemo(() => {
    if (!filtroCategoria) return historial;
    return historial.filter((h) => h.categoriaNombre === filtroCategoria);
  }, [historial, filtroCategoria]);
  const mesActual = new Date();
  mesActual.setDate(1);
  mesActual.setHours(0, 0, 0, 0);
  const bajasEsteMes = historial.filter((h) => {
    const f = h.fechaBaja?.toDate?.();
    return f && f >= mesActual;
  }).length;
  return {
    historial,
    loading,
    filtroCategoria,
    setFiltroCategoria,
    categorias,
    historialFiltrado,
    bajasEsteMes,
  };
}