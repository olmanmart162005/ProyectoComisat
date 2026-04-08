import { Link } from "react-router";
import { useEffect } from "react";

function upsertMeta(name, content) {
  if (!content) return;

  let meta = document.querySelector(`meta[name="${name}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

export default function PageShell({
  title,
  description,
  pageTitle,
  breadcrumbCurrent,
  breadcrumbItems,
  showPageTitle = true,
  contentClassName = "min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12",
  children,
  homeLabel = "Home",
  homePath = "/",
}) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    upsertMeta("description", description);
  }, [description]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                to={homePath}
              >
                {homeLabel}
              </Link>
            </li>

            {Array.isArray(breadcrumbItems) && breadcrumbItems.length > 0 ? (
              breadcrumbItems.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className={`inline-flex items-center gap-1.5 text-sm ${
                    index === breadcrumbItems.length - 1
                      ? "font-medium text-brand-600 dark:text-brand-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <svg
                    className="stroke-current text-gray-400 dark:text-gray-500"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{item}</span>
                </li>
              ))
            ) : breadcrumbCurrent ? (
              <li className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
                <svg
                  className="stroke-current text-gray-400 dark:text-gray-500"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{breadcrumbCurrent}</span>
              </li>
            ) : null}
          </ol>
        </nav>

        {showPageTitle && pageTitle ? (
          <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            {pageTitle}
          </h2>
        ) : null}
      </div>

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
