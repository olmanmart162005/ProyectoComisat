export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconWrapperClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200",
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 flex items-center gap-4 overflow-hidden group">
      {/* Línea sutil de acento superior al hover */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-[#05274f]/40 dark:group-hover:via-blue-400/40 transition-all duration-300" />
      
      {/* Contenedor de Icono con micro-interacción */}
      <div
        className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-105 ${iconWrapperClass}`}
      >
        {icon}
      </div>

      {/* Textos y Datos */}
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
          {title}
        </span>
        <h4 className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
          {value}
        </h4>
        {subtitle ? (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-400 truncate">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
