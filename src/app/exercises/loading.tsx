export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="glass p-6 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded" />
        <div className="mt-3 h-4 w-64 bg-white/10 rounded" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass p-6 h-40 animate-pulse" />
        <div className="glass p-6 h-40 animate-pulse" />
      </div>
    </div>
  );
}
