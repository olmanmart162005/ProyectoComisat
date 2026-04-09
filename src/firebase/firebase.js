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
    Puedes obtenerlos en la consola de Firebase



// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa el servicio de autenticacion
export const auth = getAuth(app);
// Inicializa el servicio de Firestore
export const db = getFirestore(app);
// Inicializa el servicio de Storage
export const storage = getStorage(app);
