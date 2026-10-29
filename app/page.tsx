import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { bricolage } from "@/lib/fonts";
import PublicSiteFooter from "@/components/public-site-footer";
import SiteMenu from "@/components/site-menu";
import { HomeTryIt } from "@/components/home-try-it";
import { CAMPAIGN_TEMPLATES } from "@/lib/templates/campaign-templates";

export const metadata: Metadata = {
  title: "Flowly - Instagram comment-to-DM automation",
  description:
    "Send an Instagram DM automatically when someone comments a keyword on your post or reel, through Instagram's official API.",
};

const delay = (seconds: number): CSSProperties => ({
  animationDelay: `${seconds}s`,
});

/* ─── Hero: the product, playing once ─────────────────────────────────────── */

function Avatar({ initial, tone }: { initial: string; tone: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${tone}`}
    >
      {initial}
    </span>
  );
}

function Comment({
  handle,
  initial,
  tone,
  time,
  children,
  className = "",
  style,
}: {
  handle: string;
  initial: string;
  tone: string;
  time: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <li className={`flex items-start gap-3 ${className}`} style={style}>
      <Avatar initial={initial} tone={tone} />
      <p className="min-w-0 text-[15px] leading-snug text-ink">
        <span className="font-semibold">{handle}</span>{" "}
        <span className="text-slate">{children}</span>
        <span className="mt-0.5 block text-xs text-slate/70">{time}</span>
      </p>
    </li>
  );
}

function HeroConversation() {
  return (
    <div
      className="relative mx-auto w-full max-w-md"
      role="img"
      aria-label="A follower comments the word guide on an Instagram post, and moments later receives a direct message with a link to the guide."
    >
      {/* The post and its comments */}
      <div className="rounded-[28px] border border-ink/10 bg-white p-5 pb-8 shadow-[0_24px_60px_-28px_rgba(11,30,91,0.35)]">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-sky to-signal"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">studio.store</p>
            <p className="truncate text-sm text-slate">
              Spring drop is live. Comment &ldquo;guide&rdquo; for the styling guide
            </p>
          </div>
        </div>

        <ul className="mt-5 space-y-4 border-t border-ink/10 pt-5">
          <Comment handle="jon.makes" initial="J" tone="bg-[#7c8db8]" time="2m">
            the blue one, finally
          </Comment>
          <Comment handle="ana.k" initial="A" tone="bg-[#a3b1d6]" time="1m">
            need this for summer
          </Comment>
          <Comment
            handle="maya.co"
            initial="M"
            tone="bg-signal"
            time="Just now"
            className="flowly-rise"
            style={delay(0.5)}
          >
            <span
              className="flowly-mark rounded-md px-1 font-semibold text-ink"
              style={delay(1.1)}
            >
              guide
            </span>{" "}
            please!
          </Comment>
        </ul>
      </div>

      {/* The DM it triggers */}
      <div
        className="flowly-rise relative -mt-3 ml-6 rounded-[28px] bg-ink p-5 text-white shadow-[0_30px_70px_-30px_rgba(11,30,91,0.7)] sm:ml-12"
        style={delay(1.5)}
      >
        <p className="text-sm text-white/60">Message to maya.co</p>

        <div className="mt-3 grid">
          <div
            className="flowly-typing col-start-1 row-start-1 flex w-fit gap-1.5 rounded-[20px] rounded-bl-md bg-white/12 px-4 py-3.5"
            style={delay(1.8)}
            aria-hidden="true"
          >
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span className="h-2 w-2 rounded-full bg-white/80" />
            <span className="h-2 w-2 rounded-full bg-white/80" />
          </div>

          <div
            className="flowly-rise col-start-1 row-start-1 max-w-[19rem]"
            style={delay(2.75)}
          >
            <p className="rounded-[20px] rounded-bl-md bg-white px-4 py-3 text-[15px] leading-snug text-ink">
              Hey Maya! Here&rsquo;s the spring styling guide you asked for.
            </p>
            <span className="mt-2 block rounded-full bg-signal px-4 py-2.5 text-center text-sm font-semibold">
              Open the guide
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Page content ────────────────────────────────────────────────────────── */

const timeline = [
  {
    time: "0s",
    title: "Maya comments “guide”",
    body: "On a post, a reel, or an ad made from one.",
  },
  {
    time: "Instantly",
    title: "Flowly matches your keyword",
    body: "Instagram tells Flowly the moment the comment is posted.",
  },
  {
    time: "Seconds later",
    title: "The DM lands in her inbox",
    body: "A private reply from your account, sent through Instagram’s own API.",
  },
  {
    time: "Later",
    title: "She taps the link, you see it",
    body: "Links are tracked, so you can see which post actually sold.",
  },
];

const sectionLinks = [
  { label: "How it works", href: "#how" },
  { label: "Try it", href: "#try" },
  { label: "Features", href: "#features" },
  { label: "Why it’s safe", href: "#trust" },
  { label: "Questions", href: "#questions" },
];

const keywordWall = [
  { word: "recipe", sends: "The full recipe, ingredients and all" },
  { word: "size", sends: "The size chart for that exact fit" },
  { word: "link", sends: "The product page, no bio link hunt" },
  { word: "code", sends: "A discount code, just for them" },
  { word: "join", sends: "A spot on your waitlist" },
];

const setupSteps = [
  {
    title: "Connect Instagram",
    body: "Log in with Instagram and approve the permissions. Business and Creator accounts both work.",
  },
  {
    title: "Pick a post",
    body: "Choose a post or reel you’ve already shared, or let the campaign wait for your next one.",
  },
  {
    title: "Write the keywords and the DM",
    body: "Add the words to listen for and the message to send. A preview shows exactly what followers will get.",
  },
  {
    title: "Turn it on",
    body: "From then on every matching comment gets its DM, day and night, without you opening the app.",
  },
];

// Sample figures for the results preview. Labelled as an example on the page.
const sampleStats = [
  { label: "DMs sent", value: "1,284" },
  { label: "Clicks", value: "412" },
  { label: "Click rate", value: "32%" },
  { label: "Skipped", value: "37" },
];

const sampleKeywords = [
  { word: "guide", count: 812 },
  { word: "link", count: 301 },
  { word: "size", count: 171 },
];

const capabilities = [
  {
    title: "Any keyword, or any comment",
    body: "Match one word, a list of words, or reply to everyone who comments.",
  },
  {
    title: "A public reply under the comment",
    body: "Rotate between a few replies so the thread doesn’t look automated.",
  },
  {
    title: "A button that reveals the link",
    body: "Open with a short message and a button. The link arrives when they tap it.",
  },
  {
    title: "Follow first, then the link",
    body: "Optionally ask people to follow your account before the link is sent.",
  },
  {
    title: "A thank-you a little later",
    body: "Schedule a follow-up message minutes after the link went out.",
  },
  {
    title: "DMs and story replies too",
    body: "The same keywords can trigger a reply when someone messages you directly.",
  },
  {
    title: "Set it up before you post",
    body: "A campaign can wait for your next post and attach itself when it goes live.",
  },
  {
    title: "Several accounts, one login",
    body: "Run campaigns for multiple Instagram accounts from separate workspaces.",
  },
];

const safeguards = [
  {
    title: "No passwords, no scraping",
    body: "You connect through Instagram’s own login and choose what Flowly can do. You can disconnect any time from Instagram’s settings.",
  },
  {
    title: "Instagram’s limits, respected",
    body: "Sends stay under Instagram’s hourly cap for private replies. When a busy post hits it, the rest wait and go out later instead of failing.",
  },
  {
    title: "Every DM accounted for",
    body: "Each comment shows whether its DM was sent, is waiting, or was skipped and why, so nothing disappears silently.",
  },
];

const questions = [
  {
    q: "Is this allowed by Instagram?",
    a: "Yes. Flowly only uses Instagram’s official API with permissions you grant when you connect. No passwords, no scraping, no browser automation.",
  },
  {
    q: "Which Instagram accounts work?",
    a: "Business and Creator accounts. Personal accounts can’t be connected, but you can switch yours in Instagram’s settings in a minute.",
  },
  {
    q: "What if Instagram doesn’t notify Flowly about a comment?",
    a: "Flowly also checks your recent posts every few minutes and answers any matching comment it missed, so a dropped notification doesn’t mean a missed DM.",
  },
  {
    q: "Can I use it for my clients?",
    a: "Yes. Give each client a workspace, connect their Instagram account, and invite them to see their own results.",
  },
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className={`${bricolage.className} min-h-screen bg-white text-ink`}>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-ink/10 bg-white/85 pl-5 pr-2 shadow-[0_10px_30px_-18px_rgba(11,30,91,0.45)] backdrop-blur">
          <Link href="/" aria-label="Flowly home" className="shrink-0">
            <img src="/logo.png" alt="Flowly" className="h-7 w-auto" />
          </Link>

          <nav aria-label="Page sections" className="hidden items-center gap-1 text-[15px] text-slate lg:flex">
            {sectionLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-full px-4 py-2 hover:bg-mist hover:text-ink">
                {link.label}
              </a>
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
            <SiteMenu links={sectionLinks} />
          </div>
        </div>
      </header>

      {/* Hero: a poster, not a banner */}
      <section className="px-3 pt-3 sm:px-5">
        <div className="relative mx-auto w-full max-w-[90rem] overflow-hidden rounded-[40px] bg-signal text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-sky/35 blur-3xl"
          />
          <div className="relative mx-auto grid grid-cols-1 w-full max-w-6xl items-center gap-14 px-5 pb-16 pt-12 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:pb-20 lg:pt-16">
            <div>
              <h1 className="text-[3.4rem] font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-[5rem] lg:text-[5.75rem]">
                <span className="block">Comment</span>
                <span className="block">
                  <span
                    className="flowly-mark inline-block rounded-[0.16em] px-[0.1em] pb-[0.12em] leading-[0.86] text-ink"
                    style={delay(0.3)}
                  >
                    &ldquo;guide&rdquo;
                  </span>
                  .
                </span>
                <span className="block text-white/55">Get the guide.</span>
              </h1>

              <p className="mt-8 max-w-lg text-xl leading-relaxed text-white/85">
                Pick a post and a keyword. Everyone who comments it gets your
                message in their Instagram DMs, within seconds.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-full bg-white px-8 py-4 text-center text-base font-semibold text-ink hover:bg-mist"
                >
                  Get started
                </Link>
                <a
                  href="#try"
                  className="rounded-full border border-white/40 px-8 py-4 text-center text-base font-semibold text-white hover:border-white hover:bg-white/10"
                >
                  Try it here
                </a>
              </div>
              <p className="mt-6 text-sm text-white/70">
                Built on Instagram&rsquo;s official API. Works with Business and
                Creator accounts.
              </p>
            </div>

            <HeroConversation />
          </div>
        </div>
      </section>

      {/* Keywords: what one word can send */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
          One word in the comments. The right thing in their DMs.
        </h2>
        <ul className="mt-12 border-b border-ink/10 lg:mt-16">
          {keywordWall.map((item) => (
            <li
              key={item.word}
              className="group grid grid-cols-1 gap-2 border-t border-ink/10 py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-10 lg:py-7"
            >
              <p className="text-[3.25rem] font-extrabold leading-none tracking-[-0.05em] text-ink transition-colors duration-200 group-hover:text-signal sm:text-7xl lg:text-[6.5rem]">
                {item.word}
              </p>
              <p className="text-lg text-slate sm:max-w-xs sm:text-right sm:text-xl">
                {item.sends}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-mist">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="max-w-2xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            From comment to DM in seconds
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
            You set up the campaign once. After that, every matching comment
            gets its DM while the person is still looking at your post.
          </p>

          <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
            {/* The track the steps sit on */}
            <span
              aria-hidden="true"
              className="absolute bottom-2 left-[7px] top-2 w-px bg-ink/15 md:bottom-auto md:left-2 md:right-2 md:top-[7px] md:h-px md:w-auto"
            />
            {timeline.map((step, index) => (
              <li key={step.time} className="relative pl-9 md:pl-0 md:pt-10">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-[3px] md:top-0 ${
                    index === timeline.length - 1
                      ? "border-signal bg-mist"
                      : "border-signal bg-signal"
                  }`}
                />
                <p className="text-4xl font-extrabold tracking-[-0.04em] text-signal">
                  {step.time}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Try it */}
      <section id="try" className="scroll-mt-24 px-3 sm:px-5">
        <div className="mx-auto w-full max-w-[90rem] rounded-[40px] bg-ink text-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
            <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Comment like a follower and watch the DM arrive
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Pick a keyword, write a comment, and post it. This is the same
              match a real campaign makes on your posts.
            </p>
            <div className="mt-12">
              <HomeTryIt />
            </div>
          </div>
        </div>
      </section>

      {/* Setup, from the account owner's side */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Set up a campaign in about four minutes
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate">
              No flow builder to learn. One screen, top to bottom, and you can
              start from a template if you&rsquo;d rather not write the DM
              yourself.
            </p>
            <Link
              href="/templates"
              className="mt-8 inline-flex rounded-full border border-ink/15 px-6 py-3 text-base font-semibold text-ink hover:border-ink/40"
            >
              Browse templates
            </Link>
          </div>

          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {setupSteps.map((step, index) => (
              <li key={step.title} className="rounded-[28px] bg-mist p-6 sm:p-7">
                <span className="text-6xl font-extrabold leading-none tracking-[-0.05em] text-signal">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-24">
        <div className="mx-auto grid grid-cols-1 w-full max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              More than one auto-reply
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate">
              Each campaign decides what to listen for, what to say in public,
              and how the conversation goes in the DMs.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className="border-t border-ink/10 py-6">
                <dt className="text-lg font-semibold leading-snug">{item.title}</dt>
                <dd className="mt-2 text-[15px] leading-relaxed text-slate">{item.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Results */}
      <section className="bg-mist">
        <div className="mx-auto grid grid-cols-1 w-full max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-28">
          <div>
            <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Know which post actually sold
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate">
              Every DM and every tap on its link is counted, per campaign and per
              keyword. See what was sent, what was skipped and why, and how many
              people clicked through.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate">
              Working for a client? Send them a report link. They see the
              results without needing an account.
            </p>
          </div>

          <figure className="rounded-[32px] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(11,30,91,0.45)] sm:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-lg font-semibold">Spring drop, &ldquo;guide&rdquo; campaign</p>
              <p className="text-sm text-slate">Last 30 days</p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {sampleStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-sm text-slate">{stat.label}</dt>
                  <dd className="mt-1 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 border-t border-ink/10 pt-6">
              <p className="text-sm font-semibold">Top keywords</p>
              <ul className="mt-4 space-y-3">
                {sampleKeywords.map((item) => (
                  <li key={item.word} className="grid grid-cols-[4rem_1fr_3.5rem] items-center gap-3 text-[15px]">
                    <span className="font-semibold">{item.word}</span>
                    <span className="h-2.5 rounded-full bg-mist">
                      <span
                        className="block h-full rounded-full bg-signal"
                        style={{ width: `${(item.count / sampleKeywords[0].count) * 100}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-slate">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className="mt-6 text-sm text-slate">Example figures</figcaption>
          </figure>
        </div>
      </section>

      {/* Who it's for, from the real campaign templates */}
      <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <h2 className="max-w-3xl text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
          Made for anyone whose comments ask for something
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate">
          Each of these starts from a ready-made template with keywords and a
          DM already written. Change the words, keep the setup.
        </p>

        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPAIGN_TEMPLATES.slice(0, 6).map((template) => (
            <li key={template.slug}>
              <Link
                href={`/templates/${template.slug}`}
                className="group flex h-full flex-col rounded-[28px] border border-ink/10 p-6 hover:border-signal hover:bg-mist/60"
              >
                <p className="text-xl font-semibold leading-snug">{template.audience}</p>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-slate">{template.outcome}</p>
                <p className="mt-5 flex flex-wrap gap-2">
                  {template.keywords.map((word) => (
                    <span key={word} className="rounded-full bg-mist px-3 py-1 text-sm font-semibold lowercase text-ink group-hover:bg-white">
                      {word}
                    </span>
                  ))}
                </p>
                <p className="mt-5 text-sm font-semibold text-signal">
                  Use this template, about {template.setupMinutes} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section id="trust" className="scroll-mt-24 bg-ink text-white">
        <div className="mx-auto grid grid-cols-1 w-full max-w-6xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-28">
          <div>
            <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
              Official API, no shortcuts
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/75">
              Flowly talks to Instagram the way Instagram allows: through its
              official API, with the permissions you grant. Your account is never
              at the mercy of a bot pretending to be you.
            </p>
            <Link
              href="/login"
              className="mt-9 inline-flex rounded-full bg-white px-7 py-3.5 text-base font-semibold text-ink hover:bg-mist"
            >
              Connect your account
            </Link>
          </div>

          <ul className="space-y-8 lg:pt-2">
            {safeguards.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-sky" />
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-white/70">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Questions */}
      <section id="questions" className="scroll-mt-24">
        <div className="mx-auto w-full max-w-3xl px-5 py-20 sm:px-8 lg:py-28">
          <h2 className="text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl">
            Questions people ask first
          </h2>
          <div className="mt-10 border-b border-ink/10">
            {questions.map((item) => (
              <details key={item.q} className="group border-t border-ink/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mist text-xl leading-none text-signal transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-[16px] leading-relaxed text-slate">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="relative mx-auto w-full max-w-[90rem] overflow-hidden rounded-[40px] bg-signal text-white">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-48 -left-32 h-[32rem] w-[32rem] rounded-full bg-sky/35 blur-3xl"
          />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-5 py-20 sm:px-8 lg:py-28">
            <h2 className="max-w-4xl text-balance text-5xl font-extrabold leading-[0.92] tracking-[-0.05em] sm:text-7xl lg:text-[6rem]">
              Your next post&rsquo;s comments are already on their way.
            </h2>
            <Link
              href="/login"
              className="rounded-full bg-white px-9 py-4 text-lg font-semibold text-ink hover:bg-mist"
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
