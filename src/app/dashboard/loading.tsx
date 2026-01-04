export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="lab-card rounded-2xl p-5">
        <div className="skeleton h-3 w-24" />
        <div className="mt-3 skeleton h-8 w-64" />
        <div className="mt-3 skeleton h-4 w-80" />
        <div className="mt-5 flex gap-2">
          <div className="skeleton h-8 w-28 rounded-xl" />
          <div className="skeleton h-8 w-36 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        </div>

        <div className="lab-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-3 w-10" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
