const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

exports.gestionarStockCredito = onDocumentWritten(
  "creditos/{creditoId}",
  async (event) => {
    const antes = event.data?.before?.data();
    const despues = event.data?.after?.data();

    if (!despues) return;

    const productoId = despues.productoId;
    const cantidad = despues.cantidad;
    const estadoNuevo = despues.estado;
    const estadoAntes = antes?.estado;

    const productoRef = db.collection("productos").doc(productoId);

    // Caso 1: nueva reserva → restar stock
    if (!antes && estadoNuevo === "Pendiente") {
      await productoRef.update({ stock: FieldValue.increment(-cantidad) });
      return;
    }

    // Caso 2: admin rechaza → devolver stock
    if (estadoAntes === "Pendiente" && estadoNuevo === "Rechazado") {
      await productoRef.update({ stock: FieldValue.increment(cantidad) });
      return;
    }

    // Caso 3: cliente cancela → devolver stock
    if (estadoAntes === "Pendiente" && estadoNuevo === "Cancelado") {
      await productoRef.update({ stock: FieldValue.increment(cantidad) });
      return;
    }
  }
);
