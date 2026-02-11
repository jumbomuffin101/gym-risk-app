"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { BRAND_ICON_ALT, BRAND_ICON_SRC } from "@/lib/brand";

type NavItem = { href: string; label: string; match?: "exact" | "section" };

const appLinks: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", match: "exact" },
  { href: "/exercises", label: "Exercises", match: "exact" },
  { href: "/workouts", label: "Workouts", match: "exact" },
  { href: "/workouts/new", label: "New Workout", match: "exact" },
  { href: "/history", label: "History", match: "exact" },
];

function isActive(pathname: string, href: string, match: "exact" | "section" = "exact") {
  if (match === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function pillClass(active: boolean) {
  return [
    "rounded-full px-3 py-1.5 text-sm font-medium transition border outline-none",
    active
      ? "bg-[rgba(34,197,94,0.10)] text-white/95 border-[rgba(34,197,94,0.35)]"
      : "text-white/75 border-transparent hover:text-white hover:bg-white/[0.04] hover:border-white/10",
  ].join(" ");
}

export default function Nav() {
  const pathname = usePathname();
  const { status, data } = useSession();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const authed = status === "authenticated";
  const hidden = pathname === "/" || pathname === "/signin" || pathname === "/signup";
  const links = authed ? appLinks : [{ href: "/signin", label: "Sign in" }, { href: "/signup", label: "Create account" }];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && panelRef.current) {
      const firstLink = panelRef.current.querySelector<HTMLElement>('a[href]');
      firstLink?.focus();
    }
  }, [open]);

  if (hidden) return null;

  const initials = data?.user?.email?.slice(0, 1)?.toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--lab-accent-border)] bg-[var(--lab-bg)]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/90">
          <Image src={BRAND_ICON_SRC} alt={BRAND_ICON_ALT} width={36} height={36} className="object-contain" />
          <span>Gym-Risk</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--lab-accent-border)] bg-[var(--lab-surface)] p-1 text-xs text-white/80 md:flex">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pillClass(isActive(pathname, item.href, item.match ?? "exact"))}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {authed ? <span className="hidden sm:flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/85">{initials}</span> : null}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/[0.06] hover:text-white"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav-panel" ref={panelRef} className="border-t border-white/10 bg-[var(--lab-bg)]" role="dialog" aria-modal="true">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pillClass(isActive(pathname, item.href, item.match ?? "exact"))}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
