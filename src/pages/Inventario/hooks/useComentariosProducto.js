import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase/firebase";
import { registrarBitacora } from "../../../services/bitacora";
import { notify } from "../../../services/notifier";

const obtenerFechaComentario = (comentario) => {
  const valor =
    comentario?.["fechaReseña"] ??
    comentario?.fechaResena ??
    comentario?.fecha ??
    comentario?.fechaRegistro ??
    null;

  if (!valor) return 0;
  if (typeof valor?.toDate === "function") return valor.toDate().getTime();
  if (valor instanceof Date) return valor.getTime();
  if (typeof valor === "number") return valor;

  const parsed = new Date(valor).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export function useComentariosProducto({ productoId, user, nombreEmpleado }) {
  const [producto, setProducto] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);

  const cargarDatos = useCallback(async () => {
    if (!productoId) {
      setProducto(null);
      setComentarios([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [productoSnap, comentariosSnap] = await Promise.all([
        getDoc(doc(db, "productos", productoId)),
        getDocs(
          query(
            collection(db, "reseñas"),
            where("productoId", "==", productoId),
          ),
        ),
      ]);

      if (productoSnap.exists()) {
        setProducto({ id: productoSnap.id, ...productoSnap.data() });
      } else {
        setProducto(null);
      }

      const docs = comentariosSnap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => obtenerFechaComentario(b) - obtenerFechaComentario(a));

      setComentarios(docs);
    } catch (error) {
      console.error("Error al cargar comentarios del producto:", error);
      notify.loadError("los comentarios del producto");
      setProducto(null);
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const estadisticas = useMemo(() => {
    const comentariosVisibles = comentarios.filter(
      (comentario) => comentario.visible !== false,
    );

    const visibles = comentariosVisibles.length;
    const ocultos = comentarios.length - visibles;
    const promedio =
      visibles > 0
        ? comentariosVisibles.reduce(
            (acc, comentario) => acc + (Number(comentario.estrellas) || 0),
            0,
          ) / visibles
        : 0;

    return {
      total: comentarios.length,
      visibles,
      ocultos,
      promedio,
    };
  }, [comentarios]);

  const toggleVisibilidad = async (comentario) => {
    if (!productoId || !comentario?.id) return;

    const visibleActual = comentario.visible !== false;
    const nuevaVisibilidad = !visibleActual;

    setProcesando(comentario.id);
    try {
      await updateDoc(doc(db, "reseñas", comentario.id), {
        visible: nuevaVisibilidad,
        fechaModificacion: serverTimestamp(),
      });

      await registrarBitacora({
        usuario: user?.email ?? "desconocido",
        nombre: nombreEmpleado || user?.email || "desconocido",
        coleccion: "reseñas",
        accion: nuevaVisibilidad ? "activar" : "ocultar",
        docId: comentario.id,
        metadata: {
          productoId,
          productoNombre: producto?.nombre ?? comentario.productoNombre ?? "",
          visible: nuevaVisibilidad,
          empleadoId: comentario.empleadoId ?? null,
        },
      });

      setComentarios((prev) =>
        prev.map((item) =>
          item.id === comentario.id
            ? {
                ...item,
                visible: nuevaVisibilidad,
              }
            : item,
        ),
      );

      notify.success(
        nuevaVisibilidad
          ? "Comentario restaurado con éxito"
          : "Comentario ocultado con éxito",
      );
    } catch (error) {
      console.error("Error al actualizar visibilidad:", error);
      notify.updateError("la visibilidad del comentario");
    } finally {
      setProcesando(null);
    }
  };

  return {
    producto,
    comentarios,
    loading,
    procesando,
    estadisticas,
    toggleVisibilidad,
    recargar: cargarDatos,
  };
}
