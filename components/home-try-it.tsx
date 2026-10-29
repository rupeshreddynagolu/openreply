"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { matchKeywords } from "@/lib/utils/keyword-matcher";

// The home page's hands-on demo: pick a keyword, write a comment, and watch
// the DM Flowly would send. It runs the same matcher campaigns use, with
// their default whole-word setting.
const keywords = [
  { word: "guide", reply: "Here’s the spring styling guide you asked for.", button: "Open the guide" },
  { word: "recipe", reply: "Here’s the full recipe, ingredients and all.", button: "Get the recipe" },
  { word: "size", reply: "Here’s the size chart, with measurements for every fit.", button: "See the size chart" },
  { word: "code", reply: "Thanks for commenting! Your 10% code is SPRING10.", button: "Shop with the code" },
];

type Result =
  | { state: "idle" }
  | { state: "typing"; text: string }
  | { state: "sent"; text: string }
  | { state: "quiet"; text: string };

export function HomeTryIt() {
  const [active, setActive] = useState(0);
  const [comment, setComment] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyword = keywords[active];

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function pick(index: number) {
    if (timer.current) clearTimeout(timer.current);
    setActive(index);
    setResult({ state: "idle" });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = comment.trim();
    if (!text) return;
    if (timer.current) clearTimeout(timer.current);
    setComment("");

    if (!matchKeywords(text, [keyword.word]).matched) {
      setResult({ state: "quiet", text });
      return;
    }
    setResult({ state: "typing", text });
    timer.current = setTimeout(() => setResult({ state: "sent", text }), 1100);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
      {/* The comment side */}
      <div className="rounded-[32px] bg-white p-6 text-ink sm:p-8">
        <p id="try-keyword" className="text-[15px] font-semibold">
          Your campaign&rsquo;s keyword
        </p>
        <div role="radiogroup" aria-labelledby="try-keyword" className="mt-3 flex flex-wrap gap-2">
          {keywords.map((item, index) => (
            <button
              key={item.word}
              type="button"
              role="radio"
              aria-checked={index === active}
              onClick={() => pick(index)}
              className={`rounded-full px-4 py-2 text-[15px] font-semibold ${
                index === active
                  ? "bg-ink text-white"
                  : "bg-mist text-ink hover:bg-[#dfe7ff]"
              }`}
            >
              {item.word}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-8">
          <label htmlFor="try-comment" className="text-[15px] font-semibold">
            Leave a comment as a follower
          </label>
          <div className="mt-3 flex gap-2 rounded-full border border-ink/15 bg-white p-1.5 pl-5 focus-within:border-signal focus-within:ring-4 focus-within:ring-signal/15">
            <input
              id="try-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={`Try “${keyword.word} please!”`}
              autoComplete="off"
              maxLength={120}
              className="flowly-bare-input min-w-0 flex-1 rounded-none bg-transparent text-base text-ink placeholder:text-slate/60"
            />
            <button
              type="submit"
              className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-white hover:bg-signal-hover"
            >
              Post
            </button>
          </div>
        </form>

        {result.state !== "idle" && (
          <p key={result.text + result.state} className="flowly-rise mt-6 flex items-start gap-3 text-[15px] leading-snug">
            <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-signal text-xs font-bold text-white">
              Y
            </span>
            <span className="min-w-0 break-words">
              <span className="font-semibold">you</span>{" "}
              <span className="text-slate">{result.text}</span>
            </span>
          </p>
        )}
      </div>

      {/* The DM side */}
      <div
        aria-live="polite"
        className="flex min-h-[18rem] flex-col rounded-[32px] border border-white/15 bg-white/[0.06] p-6 sm:p-8"
      >
        <p className="text-sm text-white/60">Your DMs</p>
        <div className="mt-auto pt-8">
          {result.state === "idle" && (
            <p className="text-lg leading-relaxed text-white/70">
              Post a comment with &ldquo;{keyword.word}&rdquo; in it, and the DM
              shows up here.
            </p>
          )}
          {result.state === "quiet" && (
            <p className="flowly-rise text-lg leading-relaxed text-white/80">
              No &ldquo;{keyword.word}&rdquo; in that comment, so Flowly stays
              quiet. Nobody gets a DM they didn&rsquo;t ask for.
            </p>
          )}
          {result.state === "typing" && (
            <div className="flowly-rise flex w-fit gap-1.5 rounded-[20px] rounded-bl-md bg-white/15 px-4 py-3.5" aria-label="Flowly is replying">
              <span className="flowly-dot-bounce h-2 w-2 rounded-full bg-white/80" />
              <span className="flowly-dot-bounce h-2 w-2 rounded-full bg-white/80" />
              <span className="flowly-dot-bounce h-2 w-2 rounded-full bg-white/80" />
            </div>
          )}
          {result.state === "sent" && (
            <div className="flowly-rise max-w-sm">
              <p className="rounded-[20px] rounded-bl-md bg-white px-4 py-3 text-[16px] leading-snug text-ink">
                Hey! {keyword.reply}
              </p>
              <span className="mt-2 block rounded-full bg-signal px-4 py-2.5 text-center text-sm font-semibold text-white">
                {keyword.button}
              </span>
              <p className="mt-3 text-sm text-white/60">Sent by Flowly, from your account</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
