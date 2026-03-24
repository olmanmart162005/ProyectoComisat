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
*/

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa el servicio de autenticacion 
export const auth = getAuth(app);
// Inicializa el servicio de Firestore
export const db = getFirestore(app);
// Inicializa el servicio de Storage
export const storage = getStorage(app);