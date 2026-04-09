import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { notify } from "../services/notifier";
import emailjs from "@emailjs/browser";
import PageMeta from "../components/common/PageMeta";

import { encryptPassword, decryptPassword } from "../services/crypto";
import { registrarBitacora } from "../services/bitacora";
import { useNombreEmpleadoActual } from "../hooks/useNombreEmpleadoActual";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function MetodosAcceso() {
  // No usar hook para nombre, sino obtenerlo directo de Firestore antes de registrar bitácora
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login, marcarPrimerLogin } = useAuth();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [otpEnviado, setOtpEnviado] = useState(false);
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [otpGenerado, setOtpGenerado] = useState("");
  const [otpExpira, setOtpExpira] = useState(null);
  const [enviandoOtp, setEnviandoOtp] = useState(false);

  // Si alguien entra directo a /login/metodos sin pasar por pantalla 1, lo regresamos
  if (!state?.email || !state?.userData) {
    navigate("/login");
    return null;
  }

  const { email, userData } = state;
  const esPrimerLogin = !userData.primerLoginHecho;

  const handleLoginConPassword = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await login(email, password);

      const encrypted = await encryptPassword(password, email);
      localStorage.setItem(`cred_${email}`, encrypted);

      // Obtener nombre del empleado desde Firestore
      let nombreParaBitacora = email;
      try {
        const qUsuario = query(
          collection(db, "usuarios"),
          where("correo", "==", email),
        );
        const snapUsuario = await getDocs(qUsuario);
        if (!snapUsuario.empty) {
          const datosUsuario = snapUsuario.docs[0].data();
          if (datosUsuario.empleadoId) {
            const qEmpleado = query(
              collection(db, "empleados"),
              where("_name_", "==", datosUsuario.empleadoId),
            );
            const snapEmpleado = await getDocs(qEmpleado);
            if (!snapEmpleado.empty) {
              const emp = snapEmpleado.docs[0].data();
              nombreParaBitacora =
                `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim() || email;
            } else {
              nombreParaBitacora = datosUsuario.nombre ?? email;
            }
          } else {
            nombreParaBitacora = datosUsuario.nombre ?? email;
          }
        }
      } catch (err) {
        nombreParaBitacora = email;
      }

      await registrarBitacora({
        usuario: email,
        nombre: nombreParaBitacora,
        coleccion: "usuarios",
        accion: esPrimerLogin ? "Primer ingreso" : "Ingreso",
        docId: userData.id,
        metadata: {
          primerLogin: esPrimerLogin,
          detalle: esPrimerLogin
            ? "Ingresó por primera vez al portal"
            : "Inició sesión en el portal",
        },
      });

      if (esPrimerLogin) {
        await marcarPrimerLogin(userData.id);
      }

      navigate("/");
    } catch (err) {
      if (err.message === "Cuenta inactiva") {
        notify.error({
          title: "Acceso denegado",
          description: "Tu cuenta está inactiva.",
        });
      } else if (err.code === "auth/invalid-credential") {
        notify.error({
          title: "Contraseña incorrecta",
          description: "Verifica tu contraseña e intenta de nuevo.",
        });
      } else {
        notify.error({
          title: "Error",
          description: "Ocurrió un error inesperado.",
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  const generarOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

  const handleEnviarCodigo = async () => {
    setEnviandoOtp(true);
    const codigo = generarOtp();
    const expira = Date.now() + 5 * 60 * 1000; // 5 minutos

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          nombre: userData.nombre,
          codigo,
          correo_destino: userData.correoPersonal,
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );

      setOtpGenerado(codigo);
      setOtpExpira(expira);
      setOtpEnviado(true);

      notify.success({
        title: "Código enviado",
        description: `Revisa ${userData.correoPersonal}`,
      });
    } catch (err) {
      console.error(err);
      notify.error({
        title: "Error al enviar",
        description: "No se pudo enviar el código. Intenta de nuevo.",
      });
    } finally {
      setEnviandoOtp(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (Date.now() > otpExpira) {
      notify.error({
        title: "Código expirado",
        description: "El código venció. Solicita uno nuevo.",
      });
      setOtpEnviado(false);
      return;
    }

    if (codigoIngresado.trim() !== otpGenerado) {
      notify.error({
        title: "Código incorrecto",
        description: "Verifica el código e intenta de nuevo.",
      });
      return;
    }

    const encryptedPass = localStorage.getItem(`cred_${email}`);

    if (!encryptedPass) {
      // El usuario limpió caché o entró desde otro navegador
      notify.error({
        title: "Sesión no encontrada",
        description:
          "Por seguridad necesitas ingresar tu contraseña una vez más.",
      });
      // Resetea primerLoginHecho en Firestore para forzar flujo de contraseña
      await updateDoc(doc(db, "usuarios", userData.id), {
        primerLoginHecho: false,
      });
      navigate("/login");
      return;
    }

    // Código válido — hacer login silencioso con Firebase
    setEnviando(true);
    try {
      const password = await decryptPassword(encryptedPass, email);
      await login(email, password);

      // Bitácora: Ingreso (no es primer login, porque OTP solo aplica después)
      // Obtener nombre del empleado desde Firestore
      let nombreParaBitacora = email;
      try {
        const qUsuario = query(
          collection(db, "usuarios"),
          where("correo", "==", email),
        );
        const snapUsuario = await getDocs(qUsuario);
        if (!snapUsuario.empty) {
          const datosUsuario = snapUsuario.docs[0].data();
          if (datosUsuario.empleadoId) {
            const qEmpleado = query(
              collection(db, "empleados"),
              where("_name_", "==", datosUsuario.empleadoId),
            );
            const snapEmpleado = await getDocs(qEmpleado);
            if (!snapEmpleado.empty) {
              const emp = snapEmpleado.docs[0].data();
              nombreParaBitacora =
                `${emp.nombres ?? ""} ${emp.apellidos ?? ""}`.trim() || email;
            } else {
              nombreParaBitacora = datosUsuario.nombre ?? email;
            }
          } else {
            nombreParaBitacora = datosUsuario.nombre ?? email;
          }
        }
      } catch (err) {
        nombreParaBitacora = email;
      }
      await registrarBitacora({
        usuario: email,
        nombre: nombreParaBitacora,
        coleccion: "usuarios",
        accion: "Ingreso",
        docId: userData.id,
        metadata: {
          primerLogin: false,
          detalle: "Inició sesión en el portal",
        },
      });

      navigate("/");
    } catch (err) {
      notify.error({
        title: "Error",
        description: "No se pudo iniciar sesión.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <PageMeta
        title="Método de Acceso | Comisariato San José"
        description="Selección y verificación del método de acceso para el portal administrativo."
      />
      <div className="w-full max-w-sm mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mt-1">{email}</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md px-8 py-10 space-y-4">
        {esPrimerLogin ? (
          // ── Primer login: formulario de contraseña ──
          <form onSubmit={handleLoginConPassword} className="space-y-4">
            <p className="text-sm text-gray-600">
              Es tu primer ingreso. Usa tu contraseña para continuar.
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {/* mismo SVG de ojo que tenías */}
              </button>
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm"
            >
              {enviando ? "Verificando..." : "Ingresar con contraseña"}
            </button>
          </form>
        ) : (
          // ── Logins posteriores: solo OTP ──
          <div className="space-y-3">
            {!otpEnviado ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Te enviaremos un código a{" "}
                  <span className="font-medium">{userData.correoPersonal}</span>
                </p>
                <button
                  onClick={handleEnviarCodigo}
                  disabled={enviandoOtp}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm"
                >
                  {enviandoOtp ? "Enviando..." : "Enviar código de acceso"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Ingresa el código que enviamos a{" "}
                  <span className="font-medium">{userData.correoPersonal}</span>
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={codigoIngresado}
                  onChange={(e) =>
                    setCodigoIngresado(e.target.value.replace(/\D/, ""))
                  }
                  placeholder="000000"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-center text-2xl text-gray-800 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleVerificarCodigo}
                  disabled={codigoIngresado.length < 6 || enviando}
                  className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition text-sm"
                >
                  {enviando ? "Verificando..." : "Confirmar código"}
                </button>
                <button
                  onClick={() => setOtpEnviado(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Reenviar código
                </button>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => navigate("/login")}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ← Usar otro correo
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-gray-400 uppercase tracking-widest">
        © 2026 Sistema de Comisariato — Equipo C, UNICAH
      </p>
    </div>
  );
}
