import Link from "next/link";
import SiteMenu from "@/components/site-menu";

interface PublicSiteHeaderProps {
  active?: "home" | "templates" | "agencies";
}

// The floating header used on the marketing pages other than the home page,
// which has its own with in-page section links.
const navLinks = [
  { label: "How it works", href: "/#how", key: "how" },
  { label: "Templates", href: "/templates", key: "templates" },
  { label: "For agencies", href: "/instagram-dm-automation-agencies", key: "agencies" },
  { label: "Questions", href: "/#questions", key: "questions" },
];

export default function PublicSiteHeader({ active }: PublicSiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-ink/10 bg-white/85 pl-5 pr-2 shadow-[0_10px_30px_-18px_rgba(11,30,91,0.45)] backdrop-blur">
        <Link href="/" aria-label="Flowly home" className="shrink-0">
          <img src="/logo.png" alt="Flowly" className="h-7 w-auto" />
        </Link>

        <nav aria-label="Site" className="hidden items-center gap-1 text-[15px] text-slate lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={`rounded-full px-4 py-2 hover:bg-mist hover:text-ink ${
                active === link.key ? "bg-mist font-semibold text-ink" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-[15px] font-semibold text-ink hover:bg-mist sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-hover"
          >
            Get started
          </Link>
          <SiteMenu links={navLinks} />
        </div>
      </div>
    </header>
  );
}
