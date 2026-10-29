import Link from "next/link";

export default function PublicSiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link href="/" aria-label="Flowly home" className="w-fit">
          <img src="/logo.png" alt="Flowly" className="h-6 w-auto" />
        </Link>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate">
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <Link href="/instagram-dm-automation-agencies" className="hover:text-ink">For agencies</Link>
          <Link href="/manychat-alternative" className="hover:text-ink">ManyChat alternative</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/data-deletion" className="hover:text-ink">Data deletion</Link>
        </nav>
      </div>
    </footer>
  );
}
