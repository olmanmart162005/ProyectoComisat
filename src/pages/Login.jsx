import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { notify } from "../services/notifier";
import PageMeta from "../components/common/PageMeta";
import logoKofe from "../assets/LOGO_KOFE.png";
import { Mail, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [buscando, setBuscando] = useState(false);
  const navigate = useNavigate();

  const handleContinuar = async (e) => {
    e.preventDefault();
    setBuscando(true);

    try {
      const q = query(
        collection(db, "usuarios"),
        where("correo", "==", email.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        notify.error({
          title: "Correo no encontrado",
          description: "Este correo no está registrado en el sistema.",
        });
        return;
      }

      const docSnap = snap.docs[0];
      const userData = { id: docSnap.id, ...docSnap.data() };

      if (userData.estado?.toLowerCase() === "inactivo") {
        notify.error({
          title: "Cuenta inactiva",
          description: "Tu cuenta está inactiva. Contacta al administrador.",
        });
        return;
      }

      // Pasa los datos del usuario a la pantalla 2 via navigation state
      navigate("/login/metodos", { state: { email, userData } });
    } catch (err) {
      console.error(err);
      notify.error({
        title: "Error",
        description: "Ocurrió un error. Intenta de nuevo.",
      });
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b172a] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 relative">
      <PageMeta
        title="Inicio de Sesión | KOFE – Comisariato"
        description="Portal administrativo y de gestión de KOFE Comisariato."
      />

      {/* Selector de Modo Claro / Modo Oscuro */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggleButton />
      </div>

      {/* Contenedor Principal de Login */}
      <div className="w-full max-w-md">
        {/* Tarjeta Ejecutiva de Login */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800/80 px-8 py-10 sm:px-10 sm:py-11">
          {/* Cabecera con Logotipo Oficial KOFE */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-gray-800 p-2 shadow-md border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center mb-4 transition-transform hover:scale-[1.02] overflow-hidden">
              <img
                src={logoKofe}
                alt="KOFE Logo"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>

            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-2xl font-black tracking-tight text-[#05274f] dark:text-white">
                KOFE
              </span>
              <span className="w-2 h-2 rounded-full bg-[#f75c01] self-end mb-1" />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#05274f]/70 dark:text-slate-300">
              Comisariato
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Portal Administrativo y de Gestión
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleContinuar} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Correo Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="empleado@comisat.com"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 bg-white dark:bg-gray-800/90 focus:outline-none focus:ring-2 focus:ring-[#05274f]/25 dark:focus:ring-blue-400/25 focus:border-[#05274f] dark:focus:border-blue-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={buscando}
              className="w-full bg-[#05274f] hover:bg-[#042042] dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-[#05274f]/20 dark:shadow-none transition-all flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.99] cursor-pointer"
            >
              {buscando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Pie de seguridad en la tarjeta */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} className="text-[#05274f] dark:text-blue-400 shrink-0" />
            <span>Acceso seguro institucional</span>
          </div>
        </div>

        {/* Derechos y copyright */}
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          © 2026 KOFE – Sistema de Comisariato
        </p>
      </div>
    </div>
  );
}
