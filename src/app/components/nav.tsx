"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { BRAND_ICON_ALT, BRAND_ICON_SRC } from "@/lib/brand";

type NavItem = { href: string; label: string; protected?: boolean; match?: "exact" | "section" };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", protected: true, match: "exact" },
  { href: "/exercises", label: "Exercises", protected: true, match: "exact" },
  { href: "/workouts", label: "Workouts", protected: true, match: "exact" },
  { href: "/workouts/new", label: "New Workout", protected: true, match: "exact" },
  { href: "/history", label: "History", protected: true, match: "exact" },
];

function isActive(pathname: string, href: string, match: "exact" | "section" = "exact") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function pillClass(active: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm font-medium transition border outline-none",
    active
      ? "bg-[rgba(34,197,94,0.10)] text-white/95 border-[rgba(34,197,94,0.35)] shadow-[0_0_0_1px_rgba(34,197,94,0.08),0_0_22px_rgba(34,197,94,0.14)]"
      : "text-white/75 border-transparent hover:text-white hover:bg-white/[0.04] hover:border-white/10",
  ].join(" ");
}

export default function Nav() {
  const pathname = usePathname();
  const { status, data } = useSession();
  const isAuthed = status === "authenticated";
  const [menuOpen, setMenuOpen] = useState(false);


  if (pathname === "/" || pathname === "/signin" || pathname === "/signup") {
    return null;
  }

  const initials = data?.user?.email?.slice(0, 1)?.toUpperCase() ?? "U";
  const links = isAuthed ? navItems : [
    { href: "/signin", label: "Sign in", match: "exact" as const },
    { href: "/signup", label: "Create account", match: "exact" as const },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
          <Image src={BRAND_ICON_SRC} alt={BRAND_ICON_ALT} width={32} height={32} className="h-6 w-6 object-contain" />
          <span>Gym-Risk</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] p-1 text-xs text-white/80 md:flex">
          {links.map((item) => {
            const active = isActive(pathname, item.href, item.match ?? "exact");
            return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pillClass(active)}>{item.label}</Link>;
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <span className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/85">{initials}</span>
          ) : null}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id="mobile-nav-panel" className="border-t border-white/10 bg-[var(--lab-bg)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:max-w-sm md:ml-auto">
            {links.map((item) => {
              const active = isActive(pathname, item.href, item.match ?? "exact");
              return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={pillClass(active)}>{item.label}</Link>;
            })}
          </div>
        </div>
      ) : null}
    </header>
  );
}
