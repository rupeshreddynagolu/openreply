import Link from "next/link";
import PublicSiteFooter from "@/components/public-site-footer";
import PublicSiteHeader from "@/components/public-site-header";
import { bricolage } from "@/lib/fonts";

export interface SeoPageSection {
  title: string;
  body: string;
}

export interface SeoPageConfig {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta?: string;
  bullets: string[];
  sections: SeoPageSection[];
  comparisonTitle: string;
  comparisons: Array<{
    label: string;
    ours: string;
    other: string;
  }>;
  templateLinks: Array<{
    label: string;
    href: string;
  }>;
  faqs: SeoPageSection[];
}

export default function SeoPageShell({ config }: { config: SeoPageConfig }) {
  return (
    <main className={`${bricolage.className} min-h-screen bg-white text-ink`}>
      <PublicSiteHeader />

      <section className="px-3 pt-3 sm:px-5">
        <div className="relative mx-auto w-full max-w-[90rem] overflow-hidden rounded-[40px] bg-signal text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky/35 blur-3xl"
          />
          <div className="relative mx-auto grid grid-cols-1 w-full max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <h1 className="text-balance text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-6xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-xl text-xl leading-relaxed text-white/85">
                {config.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-full bg-white px-8 py-4 text-center text-base font-semibold text-ink hover:bg-mist"
                >
                  {config.primaryCta}
                </Link>
                <Link
                  href="/templates"
                  className="rounded-full border border-white/40 px-8 py-4 text-center text-base font-semibold text-white hover:border-white hover:bg-white/10"
                >
                  {config.secondaryCta ?? "Browse templates"}
                </Link>
              </div>
            </div>

            <ul className="space-y-3">
              {config.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 rounded-[22px] bg-white px-5 py-4 text-[16px] leading-snug text-ink"
                >
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="grid grid-cols-1 gap-x-10 gap-y-2 md:grid-cols-3">
          {config.sections.map((section) => (
            <article key={section.title} className="border-t border-ink/10 py-6">
              <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.02em]">{section.title}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-slate">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-mist">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            {config.comparisonTitle}
          </h2>
          <div className="mt-10 overflow-hidden rounded-[28px] bg-white">
            <div className="hidden grid-cols-[0.8fr_1fr_1fr] border-b border-ink/10 text-sm font-semibold md:grid">
              <div className="p-5 text-slate">What you need</div>
              <div className="p-5 text-signal">Flowly</div>
              <div className="p-5 text-slate">Generic automation</div>
            </div>
            {config.comparisons.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-1 border-b border-ink/10 last:border-0 md:grid-cols-[0.8fr_1fr_1fr]"
              >
                <div className="px-5 pt-5 text-[16px] font-semibold md:pb-5">{item.label}</div>
                <div className="px-5 pt-2 text-[15px] leading-relaxed text-ink md:py-5">
                  <span className="font-semibold text-signal md:hidden">Flowly: </span>
                  {item.ours}
                </div>
                <div className="px-5 pb-5 pt-2 text-[15px] leading-relaxed text-slate md:py-5">
                  <span className="font-semibold md:hidden">Generic automation: </span>
                  {item.other}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid grid-cols-1 w-full max-w-6xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-24">
        <div>
          <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            Start from a template
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate">
            Pick a template, connect the right Instagram account, choose the
            post, and the campaign is ready. No chatbot flow to build.
          </p>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {config.templateLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex h-full items-center rounded-[22px] border border-ink/10 px-5 py-4 text-[16px] font-semibold hover:border-signal hover:bg-mist/60"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-ink/10">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            Questions people ask first
          </h2>
          <div className="mt-10 border-b border-ink/10">
            {config.faqs.map((faq) => (
              <details key={faq.title} className="group border-t border-ink/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {faq.title}
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-xl leading-none text-signal transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-slate">{faq.body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="mx-auto w-full max-w-[90rem] rounded-[40px] bg-ink py-16 text-white lg:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                Turn the next comment that asks into a DM that answers
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/75">
                For Instagram Business and Creator accounts, through
                Instagram&rsquo;s official API, with reports you can share.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-full bg-white px-8 py-4 text-base font-semibold text-ink hover:bg-mist"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
