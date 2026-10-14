export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-20 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
          <div className="space-y-2">
            <div className="w-48 h-4 rounded bg-slate-800/80" />
            <div className="w-72 h-3 rounded bg-slate-800/50" />
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-800/80" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900/50 border border-slate-800/60 p-4 space-y-2">
            <div className="w-20 h-3 rounded bg-slate-800/80" />
            <div className="w-14 h-6 rounded bg-slate-800/90" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800/60 p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
          <div className="w-40 h-4 rounded bg-slate-800/80" />
          <div className="w-28 h-8 rounded-xl bg-slate-800/60" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl bg-slate-900/60 border border-slate-800/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
