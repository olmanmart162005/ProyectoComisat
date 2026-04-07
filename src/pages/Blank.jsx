import PageShell from "../components/common/PageShell";

export default function Blank() {
  return (
    <PageShell
      title="Blank Page | TailAdmin"
      description="Blank dashboard page template for placing new content blocks."
      pageTitle="Blank Page"
    >
      <div className="mx-auto w-full max-w-[630px] text-center">
        <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
          Card Title Here
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
          Start putting content on grids or panels, you can also use different
          combinations of grids. Please check out the dashboard and other pages.
        </p>
      </div>
    </PageShell>
  );
}
