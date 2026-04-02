import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../auth/AuthProvider";

/**
 * Hook para obtener el nombre completo del empleado autenticado.
 * Devuelve el nombre completo o el correo si no se encuentra.
 */
export function useNombreEmpleadoActual() {
  const { user } = useAuth();
  const [nombreEmpleado, setNombreEmpleado] = useState("");

  useEffect(() => {
    const resolverNombre = async () => {
      if (!user?.email) return;
      try {
        // Buscar en usuarios por correo de sesión
        const qUsuario = query(
          collection(db, "usuarios"),
          where("correo", "==", user.email)
        );
        const snapUsuario = await getDocs(qUsuario);
        if (snapUsuario.empty) {
          setNombreEmpleado(user.email);
          return;
        }
        const datosUsuario = snapUsuario.docs[0].data();
        const empleadoId = datosUsuario.empleadoId;
        if (!empleadoId) {
          setNombreEmpleado(datosUsuario.nombre ?? user.email);
          return;
        }
        // Buscar en empleados por id
        const qEmpleado = query(
          collection(db, "empleados"),
          where("__name__", "==", empleadoId)
        );
        const snapEmpleado = await getDocs(qEmpleado);
        if (snapEmpleado.empty) {
          setNombreEmpleado(datosUsuario.nombre ?? user.email);
          return;
        }
        const emp = snapEmpleado.docs[0].data();
        const nombreCompleto = `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim();
        setNombreEmpleado(nombreCompleto || user.email);
      } catch (err) {
        console.error("Error resolviendo nombre del empleado:", err);
        setNombreEmpleado(user?.email ?? "desconocido");
      }
    };
    resolverNombre();
  }, [user]);

  return nombreEmpleado;
}
