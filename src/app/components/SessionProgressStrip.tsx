import Link from "next/link";

type ProgressItem = {
  id: string;
  label: string;
  href: string;
  state: "current" | "completed" | "remaining";
};

export default function SessionProgressStrip({
  items,
  title = "Session progress",
}: {
  items: ProgressItem[];
  title?: string;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 space-y-2.5">
      <div className="text-xs uppercase tracking-wide lab-muted">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => {
          const classes =
            item.state === "current"
              ? "border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-white"
              : item.state === "completed"
                ? "border-white/10 bg-white/[0.06] text-white/80"
                : "border-white/10 bg-white/[0.03] text-white/60";

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs transition hover:bg-white/[0.06] ${classes}`}
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-white/10 bg-black/10 text-[10px]">
                {index + 1}
              </span>
              <span className="max-w-[9rem] truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
