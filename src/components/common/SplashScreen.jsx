import { useEffect, useState } from "react";
import logoKofe from "../../assets/LOGO_KOFE.png";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animar la barra de carga progresivamente de 0 a 100% durante aprox 1.8s
    const startTime = performance.now();
    const duration = 1800; // 1.8 segundos

    let animationFrameId;

    const step = (now) => {
      const elapsed = now - startTime;
      const currentPercent = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPercent);

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setProgress(100);
        // Pequeña pausa al llegar al 100% antes de desvanecer suavemente
        setTimeout(() => setFadingOut(true), 150);
        // Ocultar del DOM tras el fade out
        setTimeout(() => setVisible(false), 650);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b172a] text-slate-900 dark:text-white select-none transition-opacity duration-500 ease-out pointer-events-none ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Resplandor corporativo sutil de fondo */}
      <div className="absolute w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-600/15 blur-3xl pointer-events-none -translate-y-6" />
      <div className="absolute w-64 h-64 rounded-full bg-[#f75c01]/10 blur-2xl pointer-events-none translate-y-12" />

      {/* Contenedor central */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Contenedor del Logo con bordes suaves y sombra ejecutiva */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white dark:bg-slate-800 p-3.5 shadow-xl shadow-slate-200/70 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center overflow-hidden">
            <img
              src={logoKofe}
              alt="KOFE Logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Marca KOFE y subtítulo */}
        <div className="space-y-1 mb-7">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#05274f] dark:text-white">
              KOFE
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f75c01] self-end mb-1.5" />
          </div>
          <p className="text-xs sm:text-sm font-bold tracking-[0.35em] text-slate-500 dark:text-slate-400 uppercase">
            Comisariato
          </p>
        </div>

        {/* Barra de progreso animada que se va llenando fluidamente */}
        <div className="w-56 sm:w-64 flex flex-col items-center gap-2">
          <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#05274f] via-[#0a4b8f] to-[#f75c01] transition-[width] duration-75 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full px-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
            <span className="tracking-wide">Cargando...</span>
            <span className="font-semibold text-slate-600 dark:text-slate-400 tabular-nums">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Pie de página institucional */}
      <div className="absolute bottom-6 text-[11px] font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
        Sistema de Gestión Corporativa
      </div>
    </div>
  );
}
