// src/services/bitacora.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";   // ajusta si tu archivo se llama distinto

export async function registrarBitacora({
  usuario,
  nombre,
  coleccion,
  accion,
  docId = null,
  metadata = {}
}) {
  try {
    await addDoc(collection(db, "bitacora"), {
      usuario,
      nombre,
      coleccion,
      accion,
      fecha: serverTimestamp(),
      docId,
      metadata,
    });
  } catch (error) {
    console.warn("Bitácora no registrada:", error);
  }
}