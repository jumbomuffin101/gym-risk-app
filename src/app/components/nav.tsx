"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavItem = { href: string; label: string; protected?: boolean; match?: "exact" | "section" };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", protected: true, match: "exact" },
  { href: "/exercises", label: "Exercises", protected: true, match: "exact" },
  { href: "/workouts/new", label: "New Workout", protected: true, match: "exact" },
  { href: "/workouts", label: "Workouts", protected: true, match: "exact" },
  { href: "/history", label: "History", protected: true, match: "exact" },
];

function isActive(pathname: string, href: string, match: "exact" | "section" = "exact") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function pillClass(active: boolean) {
  // IMPORTANT: no white active state, everything stays in green/black theme
  return [
    "rounded-full px-3 py-1.5 text-sm font-medium transition",
    "border outline-none",
    active
      ? [
          "bg-[rgba(34,197,94,0.10)] text-white/95",
          "border-[rgba(34,197,94,0.35)]",
          "shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_0_22px_rgba(34,197,94,0.14)]",
        ].join(" ")
      : [
          "text-white/75 border-transparent",
          "hover:text-white hover:bg-white/[0.04] hover:border-white/10",
        ].join(" "),
  ].join(" ");
}

export default function Nav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthed = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/10 backdrop-blur-md">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-white/90">
          gym-risk
        </Link>

        <nav className="flex gap-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {isAuthed ? (
            navItems.map((item) => {
              const active = isActive(pathname, item.href, item.match ?? "exact");
              return (
                <Link key={item.href} href={item.href} className={pillClass(active)}>
                  {item.label}
                </Link>
              );
            })
          ) : (
            <>
              <Link href="/signin" className={pillClass(isActive(pathname, "/signin", "exact"))}>
                Sign in
              </Link>
              <Link href="/signup" className={pillClass(isActive(pathname, "/signup", "exact"))}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
