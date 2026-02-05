"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavItem = { href: string; label: string; protected?: boolean; match?: "exact" | "section" };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", protected: true, match: "exact" },
  { href: "/exercises", label: "Exercises", protected: true, match: "exact" },
  { href: "/workouts", label: "Workouts", protected: true, match: "exact" },
  { href: "/workouts/new", label: "New Workout", protected: true, match: "exact" },
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
  const { status, data } = useSession();
  const isAuthed = status === "authenticated";
  const hideNav = pathname === "/signin" || pathname === "/signup";

  if (hideNav) {
    return null;
  }

  if (pathname === "/") {
    return null;
  }

  const initials = data?.user?.email?.slice(0, 1)?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
          <Image
            src="/brand/gym-risk-icon.png"
            alt="Gym-Risk"
            width={64}
            height={64}
            className="h-6 w-6 object-contain"
          />
          <span>Gym-Risk</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] p-1 text-xs text-white/80 md:flex">
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

        <div className="flex items-center">
          {isAuthed ? (
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
              aria-label="User menu"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/85">
                {initials}
              </span>
              <span className="hidden sm:inline">Menu</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
