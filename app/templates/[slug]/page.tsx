import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicSiteFooter from "@/components/public-site-footer";
import PublicSiteHeader from "@/components/public-site-header";
import TemplateVisual from "@/components/template-visual";
import { bricolage } from "@/lib/fonts";
import {
  CAMPAIGN_TEMPLATES,
  getCampaignTemplate,
  getCampaignTemplateSlugs,
} from "@/lib/templates/campaign-templates";

type TemplatePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getCampaignTemplateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const template = getCampaignTemplate(slug);

  if (!template) {
    return {
      title: "Template Not Found - Flowly",
    };
  }

  return {
    title: `${template.title} - Instagram Comment to DM Template`,
    description: template.summary,
    keywords: [
      `${template.title} template`,
      "Instagram comment to DM template",
      "Instagram DM campaign template",
      template.category,
      template.audience,
    ],
  };
}

// The DM as the campaign will hold it, with {placeholders} marked so it's
// clear which parts Flowly fills in per follower.
function DmMessage({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\w+\})/).map((part, index) =>
        /^\{\w+\}$/.test(part) ? (
          <span key={index} className="rounded-md bg-sky/25 px-1 font-semibold text-ink">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export default async function TemplateDetailPage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const template = getCampaignTemplate(slug);

  if (!template) {
    notFound();
  }

  const relatedTemplates = CAMPAIGN_TEMPLATES.filter(
    (item) => item.slug !== template.slug
  ).slice(0, 3);

  const facts = [
    { label: "Made for", value: template.audience },
    { label: "Goal", value: template.goal },
    { label: "Setup time", value: `About ${template.setupMinutes} minutes` },
  ];

  return (
    <main className={`${bricolage.className} min-h-screen bg-white text-ink`}>
      <PublicSiteHeader active="templates" />

      <section className="px-3 pt-3 sm:px-5">
        <div className="relative mx-auto w-full max-w-[90rem] overflow-hidden rounded-[40px] bg-signal text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky/35 blur-3xl"
          />
          <div className="relative mx-auto grid grid-cols-1 w-full max-w-6xl items-center gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div>
              <Link
                href="/templates"
                className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                All templates
              </Link>
              <h1 className="mt-8 text-balance text-5xl font-extrabold leading-[0.95] tracking-[-0.045em] sm:text-7xl">
                {template.title}
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-relaxed text-white/85">
                {template.summary}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/login?template=${template.slug}`}
                  className="rounded-full bg-white px-8 py-4 text-center text-base font-semibold text-ink hover:bg-mist"
                >
                  Use this template
                </Link>
                <a
                  href="#playbook"
                  className="rounded-full border border-white/40 px-8 py-4 text-center text-base font-semibold text-white hover:border-white hover:bg-white/10"
                >
                  Read the playbook
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md">
              <TemplateVisual template={template} />
            </div>
          </div>
        </div>
      </section>

      {/* At a glance */}
      <section className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8 lg:pt-20">
        <dl className="grid grid-cols-1 gap-x-10 border-b border-ink/10 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="border-t border-ink/10 py-6">
              <dt className="text-sm text-slate">{fact.label}</dt>
              <dd className="mt-1 text-2xl font-extrabold leading-tight tracking-[-0.02em]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* What it sends */}
      <section className="mx-auto grid grid-cols-1 w-full max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
        <div>
          <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            What it listens for, and what it sends
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-slate">
            {template.outcome}
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <p className="text-[15px] font-semibold">Keywords</p>
            <p className="mt-3 flex flex-wrap gap-2">
              {template.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-ink px-4 py-2 text-[15px] font-semibold text-white"
                >
                  {keyword}
                </span>
              ))}
            </p>
            <p className="mt-3 text-sm text-slate">
              Any comment containing one of these words gets the DM, in any mix of
              upper and lower case.
            </p>
          </div>
          <div>
            <p className="text-[15px] font-semibold">The DM</p>
            <p className="mt-3 rounded-[24px] rounded-bl-md bg-mist px-5 py-4 text-lg leading-relaxed">
              <DmMessage text={template.dmMessage} />
            </p>
            {template.dmMessage.includes("{") && (
              <p className="mt-3 text-sm text-slate">
                Flowly fills in the marked parts for each person, like their
                username.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Playbook */}
      <section id="playbook" className="scroll-mt-24 bg-mist">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
          <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
            The playbook
          </h2>
          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {template.playbook.map((step, index) => (
              <li key={step} className="rounded-[28px] bg-white p-6">
                <span className="text-5xl font-extrabold leading-none tracking-[-0.05em] text-signal">
                  {index + 1}
                </span>
                <p className="mt-5 text-[16px] leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold">Works well for</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {template.bestFor.map((item) => (
                  <li key={item} className="rounded-full bg-white px-4 py-2 text-[15px]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Numbers to watch</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {template.metrics.map((item) => (
                  <li key={item} className="rounded-full bg-white px-4 py-2 text-[15px]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use it */}
      <section className="px-3 pt-3 sm:px-5">
        <div className="mx-auto w-full max-w-[90rem] rounded-[40px] bg-ink py-16 text-white lg:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
                Copy this campaign into Flowly
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-white/75">
                Sign in, connect Instagram, and pick a post or reel. The keywords
                and DM arrive already filled in, ready to edit.
              </p>
            </div>
            <Link
              href={`/login?template=${template.slug}`}
              className="shrink-0 rounded-full bg-white px-8 py-4 text-base font-semibold text-ink hover:bg-mist"
            >
              Use this template
            </Link>
          </div>
        </div>
      </section>

      {/* More templates */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
          More templates
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {relatedTemplates.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/templates/${item.slug}`}
                className="flex h-full flex-col rounded-[28px] border border-ink/10 p-6 hover:border-signal hover:bg-mist/60"
              >
                <p className="text-sm text-slate">{item.category}</p>
                <h3 className="mt-2 text-xl font-extrabold leading-snug tracking-[-0.01em]">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate">
                  {item.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <PublicSiteFooter />
    </main>
  );
}
