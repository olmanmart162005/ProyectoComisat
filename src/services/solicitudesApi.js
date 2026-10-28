import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export async function registrarSolicitudApi({
  servicio,
  operacion,
  duracionMs,
  estado,
  codigoError,
}) {
  try {
    await addDoc(collection(db, "solicitudes_api"), {
      servicio,
      operacion,
      duracionMs: Math.max(0, Math.round(Number(duracionMs) || 0)),
      estado,
      fecha: serverTimestamp(),
      usuario: auth.currentUser?.email || "anonimo",
      ...(codigoError ? { codigoError } : {}),
    });
  } catch (error) {
    console.warn("No se pudo registrar la solicitud API:", error?.code || error);
  }
}

export async function medirSolicitudApi({ servicio, operacion }, ejecutar) {
  const inicio = performance.now();
  try {
    const resultado = await ejecutar();
    await registrarSolicitudApi({
      servicio,
      operacion,
      duracionMs: performance.now() - inicio,
      estado: "exito",
    });
    return resultado;
  } catch (error) {
    await registrarSolicitudApi({
      servicio,
      operacion,
      duracionMs: performance.now() - inicio,
      estado: "error",
      codigoError: error?.code,
    });
    throw error;
  }
}