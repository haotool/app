export default function HomeSkeleton() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-slate-200 rounded animate-pulse" />
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
      </header>
      <div className="px-4 py-3">
        <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
      </div>
      <div className="flex-1 px-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse"
          />
        ))}
      </div>
      <div className="flex justify-center py-4">
        <div className="w-14 h-14 bg-slate-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
