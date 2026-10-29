"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";

export interface SiteMenuLink {
  label: string;
  href: string;
}

// The header's menu below laptop width, where the inline links are hidden.
// It opens as a panel under the floating header and closes on a link tap,
// Escape, or a tap outside it.
export default function SiteMenu({ links }: { links: SiteMenuLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={root} className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-mist"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 8h16M4 16h16" />
          )}
        </svg>
      </button>

      <nav
        id={panelId}
        aria-label="Menu"
        hidden={!open}
        className="flowly-rise absolute inset-x-3 top-full mt-2 rounded-[28px] border border-ink/10 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(11,30,91,0.45)] sm:inset-x-5"
        style={{ animationDuration: "220ms" }}
      >
        <ul>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-[20px] px-5 py-3.5 text-lg font-semibold text-ink hover:bg-mist"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-ink/10 p-2 pt-4">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="block rounded-full border border-ink/15 px-5 py-3 text-center text-base font-semibold text-ink hover:border-ink/40"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </div>
  );
}
