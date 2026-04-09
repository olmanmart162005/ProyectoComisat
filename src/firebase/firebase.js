// Archivo de inicialización de Firebase
// Se utiliza para conectar la app React con los servicios de Firebase

// Importa la funcion principal para inicializar Firebase
import { initializeApp } from "firebase/app";
// Importa el servicio de autenticacion
import { getAuth } from "firebase/auth";
// Importa el servicio de Firestore
import { getFirestore } from "firebase/firestore";
// Importa el servicio de Storage
import { getStorage } from "firebase/storage";

/* Configuración de Firebase
    Debes reemplazar estos valores con los de tu proyecto de Firebase
    Puedes obtenerlos en la consola de Firebase */ 
const firebaseConfig = {
  apiKey: "AIzaSyCcPhd-O3x05Z6xFFAcCVwEhf1gJMqWyjs",
  authDomain: "comisariatoproyecto.firebaseapp.com",
  projectId: "comisariatoproyecto",
  storageBucket: "comisariatoproyecto.firebasestorage.app",
  messagingSenderId: "424513949619",
  appId: "1:424513949619:web:b6fb960ebea0badc8b05c6"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa el servicio de autenticacion
export const auth = getAuth(app);
// Inicializa el servicio de Firestore
export const db = getFirestore(app);
// Inicializa el servicio de Storage
export const storage = getStorage(app);