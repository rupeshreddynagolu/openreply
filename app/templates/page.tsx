import type { Metadata } from "next";
import Link from "next/link";
import PublicSiteFooter from "@/components/public-site-footer";
import PublicSiteHeader from "@/components/public-site-header";
import TemplateVisual from "@/components/template-visual";
import { bricolage } from "@/lib/fonts";
import { CAMPAIGN_TEMPLATES } from "@/lib/templates/campaign-templates";

export const metadata: Metadata = {
  title: "Instagram Comment to DM Templates - Flowly",
  description:
    "Copy ready-to-launch Instagram comment-to-DM campaign templates for product links, lead magnets, real estate, fitness, restaurants, events, and creators.",
  keywords: [
    "Instagram comment to DM templates",
    "comment to DM campaigns",
    "Instagram DM automation templates",
    "Manychat alternative templates",
  ],
};

export default function TemplatesPage() {
  const [featured] = CAMPAIGN_TEMPLATES;

  return (
    <main className={`${bricolage.className} min-h-screen bg-white text-ink`}>
      <PublicSiteHeader active="templates" />

      <section className="px-3 pt-3 sm:px-5">
        <div className="relative mx-auto w-full max-w-[90rem] overflow-hidden rounded-[40px] bg-signal text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky/35 blur-3xl"
          />
          <div className="relative mx-auto grid grid-cols-1 w-full max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <h1 className="text-balance text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
                Campaigns you can copy in minutes
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-relaxed text-white/85">
                Each template comes with keywords, a DM already written, and a
                short playbook. Pick one, change the words, and point it at your
                post.
              </p>
              <a
                href="#template-grid"
                className="mt-8 inline-flex rounded-full bg-white px-8 py-4 text-base font-semibold text-ink hover:bg-mist"
              >
                Browse {CAMPAIGN_TEMPLATES.length} templates
              </a>
            </div>

            <div className="mx-auto w-full max-w-md">
              <TemplateVisual template={featured} />
            </div>
          </div>
        </div>
      </section>

      <section
        id="template-grid"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-24"
      >
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_TEMPLATES.map((template) => (
            <li
              key={template.slug}
              className="flex flex-col rounded-[32px] border border-ink/10 p-3 hover:border-ink/25"
            >
              <div className="rounded-[24px] bg-mist p-4">
                <TemplateVisual template={template} compact />
              </div>
              <div className="flex flex-1 flex-col px-3 pb-3 pt-6">
                <p className="text-sm text-slate">
                  {template.category}, about {template.setupMinutes} min
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-[-0.02em]">
                  <Link href={`/templates/${template.slug}`} className="hover:text-signal">
                    {template.title}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-slate">
                  {template.summary}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={`/login?template=${template.slug}`}
                    className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-hover"
                  >
                    Use this template
                  </Link>
                  <Link
                    href={`/templates/${template.slug}`}
                    className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink/40"
                  >
                    Read the playbook
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
