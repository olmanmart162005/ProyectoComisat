import { useState } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useAuth } from "../auth/AuthProvider";

// Hook para manejar el cierre de sesión por inactividad

export function useIdleLogout(tiempoMinutos = 15) {
  const { logout } = useAuth();
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const { reset } = useIdleTimer({
    timeout: tiempoMinutos * 60 * 1000, // tiempo total de inactividad
    promptBeforeIdle: 60 * 1000, // avisa 1 minuto antes
    onPrompt: () => setMostrarAviso(true),
    onIdle: () => {
      setMostrarAviso(false);
      logout();
    },
    onActive: () => setMostrarAviso(false), // usuario volvió, cancela aviso
    throttle: 500,
  });

  // Función para cuando el usuario hace clic en "Seguir conectado"
  const continuar = () => {
    reset();
    setMostrarAviso(false);
  };

  return { mostrarAviso, continuar };
}
