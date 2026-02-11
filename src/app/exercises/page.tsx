import Image from "next/image";
import { BRAND_ICON_ALT, BRAND_ICON_SRC } from "@/lib/brand";
import ExerciseLibrary from "@/app/exercises/ExerciseLibrary";
import { requireDbUserId } from "@/app/lib/auth/requireUser";

export const runtime = "nodejs";

export default async function ExercisesPage() {
  await requireDbUserId();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 pt-6">
      <header className="lab-card rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Image src={BRAND_ICON_SRC} alt={BRAND_ICON_ALT} width={32} height={32} className="h-8 w-8 object-contain" />
          <div>
            <div className="text-xs uppercase tracking-wide lab-muted">Exercises</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white/95">Exercise library</h1>
          </div>
        </div>
      </header>

      <ExerciseLibrary />
    </div>
  );
}
