import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { notify } from "../services/notifier";
import emailjs from "@emailjs/browser";
import PageMeta from "../components/common/PageMeta";
import logoKofe from "../assets/LOGO_KOFE.png";
import { KeyRound, Eye, EyeOff, Mail, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b172a] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 relative">
      <PageMeta
        title="Método de Acceso | KOFE – Comisariato"
        description="Selección y verificación del método de acceso para el portal administrativo de KOFE."
      />

      {/* Selector de Modo Claro / Modo Oscuro */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggleButton />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800/80 px-8 py-10 sm:px-10 sm:py-11 space-y-6">
          
          {/* Cabecera con Logotipo Oficial */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 p-2 shadow-md border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center mb-3 overflow-hidden">
              <img
                src={logoKofe}
                alt="KOFE Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-xl font-black text-[#05274f] dark:text-white tracking-tight">
              Verificación de Identidad
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Mail size={13} className="text-[#05274f] dark:text-blue-400" />
              <span>{email}</span>
            </div>
          </div>

          {esPrimerLogin ? (
            // ── Primer login: formulario de contraseña ──
            <form onSubmit={handleLoginConPassword} className="space-y-5">
              <div className="bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <KeyRound size={18} className="text-[#05274f] dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Es tu primer ingreso. Ingresa tu contraseña asignada para continuar.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-[#05274f]/25 dark:focus:ring-blue-400/25 focus:border-[#05274f] dark:focus:border-blue-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-[#05274f] hover:bg-[#042042] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#05274f]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.99] cursor-pointer"
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <span>Ingresar con contraseña</span>
                )}
              </button>
            </form>
          ) : (
            // ── Logins posteriores: solo OTP ──
            <div className="space-y-4">
              {!otpEnviado ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                    Te enviaremos un código de seguridad a:
                    <span className="block mt-1 font-semibold text-[#05274f] dark:text-blue-300">{userData.correoPersonal}</span>
                  </p>
                  <button
                    onClick={handleEnviarCodigo}
                    disabled={enviandoOtp}
                    className="w-full bg-[#05274f] hover:bg-[#042042] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#05274f]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer"
                  >
                    {enviandoOtp ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Enviando código...</span>
                      </>
                    ) : (
                      <span>Enviar código de acceso</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
                    Ingresa el código que enviamos a:
                    <span className="block mt-1 font-semibold text-[#05274f] dark:text-blue-300">{userData.correoPersonal}</span>
                  </p>
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={codigoIngresado}
                      onChange={(e) =>
                        setCodigoIngresado(e.target.value.replace(/\D/, ""))
                      }
                      placeholder="000000"
                      className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-3xl text-slate-900 dark:text-white font-mono tracking-widest bg-white dark:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-[#05274f]/25 dark:focus:ring-blue-400/25 focus:border-[#05274f] dark:focus:border-blue-400 transition"
                    />
                  </div>
                  <button
                    onClick={handleVerificarCodigo}
                    disabled={codigoIngresado.length < 6 || enviando}
                    className="w-full bg-[#05274f] hover:bg-[#042042] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#05274f]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm tracking-wide cursor-pointer"
                  >
                    {enviando ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <span>Confirmar código</span>
                    )}
                  </button>
                  <button
                    onClick={() => setOtpEnviado(false)}
                    className="w-full text-xs font-semibold text-[#f75c01] hover:text-[#ea580c] transition cursor-pointer text-center"
                  >
                    Reenviar código de verificación
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate("/login")}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Usar otro correo</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          © 2026 KOFE – Sistema de Comisariato
        </p>
      </div>
    </div>
  );
}
