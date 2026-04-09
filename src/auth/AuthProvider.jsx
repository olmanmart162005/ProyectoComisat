import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { notify } from "../services/notifier";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [primerLoginHecho, setPrimerLoginHecho] = useState(null);
  const [correoPersonal, setCorreoPersonal] = useState("");
  const [usuarioDocId, setUsuarioDocId] = useState(null);

  // Unificamos en una sola función que devuelve todos los datos necesarios
  const getUserData = async (email) => {
    try {
      const q = query(collection(db, "usuarios"), where("correo", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Resolvemos el rol (igual que antes: primero rolNombre, luego rolId)
        let rolNombre = "Usuario";
        if (userData.rolNombre) {
          rolNombre = userData.rolNombre;
        } else if (userData.rolId) {
          const roleRef = doc(db, "roles", userData.rolId);
          const roleSnap = await getDoc(roleRef);
          if (roleSnap.exists()) {
            rolNombre = roleSnap.data().nombre || "Usuario";
          }
        }

        return {
          rolNombre,
          estado: userData.estado ?? "Inactivo",
          primerLoginHecho: userData.primerLoginHecho ?? false,
          correoPersonal: userData.correoPersonal ?? "",
          usuarioDocId: querySnapshot.docs[0].id,
        };
      }

      // Si no existe en Firestore, lo tratamos como inactivo
      return {
        rolNombre: "Usuario",
        estado: "Inactivo",
        primerLoginHecho: false,
        correoPersonal: "",
        usuarioDocId: null,
      };
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      return {
        rolNombre: "Usuario",
        estado: "Inactivo",
        primerLoginHecho: false,
        correoPersonal: "",
        usuarioDocId: null,
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (currentUser) {
        const data = await getUserData(currentUser.email);
        const estadoActual = data.estado?.toLowerCase();

        if (estadoActual === "activo") {
          // Todo OK: cargamos datos y liberamos
          setUser(currentUser);
          setRole(data.rolNombre);
          setEstado(data.estado);
          setPrimerLoginHecho(data.primerLoginHecho);
          setCorreoPersonal(data.correoPersonal);
          setUsuarioDocId(data.usuarioDocId);
        } else {
          // Inactivo o no encontrado: cerramos sesión
          await signOut(auth);
          setUser(null);
          setRole(null);
          setEstado(null);
          setPrimerLoginHecho(null);
          setCorreoPersonal(null);
          setUsuarioDocId(null);

          if (estadoActual === "inactivo") {
            notify.error({
              title: "Cuenta Inactiva",
              description:
                "Tu cuenta está inactiva. Contacta al administrador.",
            });
          }
        }
      } else {
        setUser(null);
        setRole(null);
        setEstado(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // En AuthProvider.jsx — actualizar la función para aceptar el parámetro
  const marcarPrimerLogin = async (docId) => {
    const id = docId || usuarioDocId; // usa el que llegue, o el del estado si ya existe
    if (!id) return;
    await updateDoc(doc(db, "usuarios", id), { primerLoginHecho: true });
    setPrimerLoginHecho(true);
  };

  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Verificamos estado ANTES de dejar pasar al usuario en la UI
    const data = await getUserData(userCredential.user.email);
    if (data.estado?.toLowerCase() === "inactivo") {
      await signOut(auth);
      throw new Error("Cuenta inactiva"); // Login.jsx lo captura
    }

    return userCredential;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        estado,
        login,
        logout,
        loading,
        primerLoginHecho,
        marcarPrimerLogin,
        correoPersonal,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
