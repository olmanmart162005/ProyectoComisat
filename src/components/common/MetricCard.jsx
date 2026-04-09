export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconWrapperClass = "bg-gray-100 dark:bg-gray-800",
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] flex items-center gap-4">
      <div
        className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-xl ${iconWrapperClass}`}
      >
        {icon}
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <h4 className="mt-0.5 text-xl font-bold text-gray-800 dark:text-white/90">
          {value}
        </h4>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
