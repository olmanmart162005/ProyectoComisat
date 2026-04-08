import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/AuthProvider";
import { db, storage } from "../../../firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { sileo } from "sileo";
import { registrarBitacora } from "../../../services/bitacora";
import { useNombreEmpleadoActual } from "../../../hooks/useNombreEmpleadoActual";

// Este hook maneja toda la lógica relacionada con categorías: carga, creación, actualización, eliminación, etc.

export function useCategorias({
  user,
  nombreEmpleado,
  cargarCategorias = true,
} = {}) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();
  const nombreEmpleadoActual = useNombreEmpleadoActual();
  const usuarioActual = user ?? authUser;
  const empleadoActual = nombreEmpleado ?? nombreEmpleadoActual;

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "categoria"));

      let cantidadPorCategoria = {};
      try {
        const productosSnap = await getDocs(collection(db, "productos"));
        cantidadPorCategoria = productosSnap.docs.reduce((acc, productoDoc) => {
          const producto = productoDoc.data();
          const categoriaId = producto.categoriaId;

          if (categoriaId) {
            acc[categoriaId] = (acc[categoriaId] ?? 0) + 1;
          }

          return acc;
        }, {});
      } catch (error) {
        console.error("Error al cargar productos asociados:", error);
      }

      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        cantidadProductos: cantidadPorCategoria[d.id] ?? 0,
      }));
      setCategorias(docs);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      sileo.error("No se pudieron cargar las categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cargarCategorias) {
      fetchCategorias();
    }
  }, [cargarCategorias]);

  const handleEliminar = async (id) => {
    try {
      const categoriaAEliminar = categorias.find((c) => c.id === id);

      await deleteDoc(doc(db, "categoria", id));

      await registrarBitacora({
        usuario: usuarioActual?.email ?? "desconocido",
        nombre: empleadoActual || usuarioActual?.email || "desconocido",
        coleccion: "categoria",
        accion: "eliminacion",
        docId: id,
        metadata: {
          nombre: categoriaAEliminar?.nombre,
        },
      });

      fetchCategorias();
      sileo.success("Categoría eliminada");
      return true;
    } catch (error) {
      console.error("Error al eliminar", error);
      sileo.error("Error al eliminar");
      return false;
    }
  };

  const subirImagen = async (archivo) => {
    const imagenRef = ref(storage, `categorias/${Date.now()}_${archivo.name}`);
    await uploadBytes(imagenRef, archivo);
    return getDownloadURL(imagenRef);
  };

  const guardarCategoria = async ({ nombre, archivoImagen, onSuccess }) => {
    if (!nombre.trim()) {
      sileo.error("El nombre de la categoría es obligatorio.");
      return;
    }

    if (!archivoImagen) {
      sileo.error("La imagen de la categoría es obligatoria.");
      return;
    }

    const imagenUrl = await subirImagen(archivoImagen);

    const docRef = await addDoc(collection(db, "categoria"), {
      nombre: nombre.trim(),
      imagenUrl,
      fechaRegistro: serverTimestamp(),
      ultimaModificacion: serverTimestamp(),
    });

    await registrarBitacora({
      usuario: usuarioActual?.email ?? "desconocido",
      nombre: empleadoActual || usuarioActual?.email || "desconocido",
      coleccion: "categoria",
      accion: "creacion",
      docId: docRef.id,
      metadata: {
        nombre: nombre.trim(),
      },
    });

    sileo.success("Categoría creada con éxito");
    await onSuccess?.();
  };

  const actualizarCategoria = async ({
    categoriaId,
    categoriaData,
    nombre,
    archivoImagen,
    imagenUrlActual,
    onSuccess,
  }) => {
    if (!categoriaId) return;

    if (!nombre.trim()) {
      sileo.error("El nombre de la categoría es obligatorio.");
      return;
    }

    let imagenUrl = imagenUrlActual || "";
    if (archivoImagen) {
      imagenUrl = await subirImagen(archivoImagen);
    }

    const datosActualizados = {
      nombre: nombre.trim(),
      imagenUrl,
      ultimaModificacion: serverTimestamp(),
    };

    await updateDoc(doc(db, "categoria", categoriaId), datosActualizados);

    await registrarBitacora({
      usuario: usuarioActual?.email ?? "desconocido",
      nombre: empleadoActual || usuarioActual?.email || "desconocido",
      coleccion: "categoria",
      accion: "actualizacion",
      docId: categoriaId,
      metadata: {
        nombreAnterior: categoriaData?.nombre,
        nombreNuevo: datosActualizados.nombre,
        imagenActualizada: Boolean(archivoImagen),
      },
    });

    sileo.success("Categoría actualizada con éxito");
    await onSuccess?.();
  };

  return {
    categorias,
    loading,
    fetchCategorias,
    handleEliminar,
    guardarCategoria,
    actualizarCategoria,
  };
}
