import type { CampaignTemplate } from "@/lib/templates/campaign-templates";

interface TemplateVisualProps {
  template: CampaignTemplate;
  compact?: boolean;
}

// The follower in each template's preview, taken from its reply ("Hey Maya, …").
function followerName(template: CampaignTemplate) {
  return template.privateReplyPreview.match(/^Hey (\p{L}+)/u)?.[1] ?? "Sam";
}

// The template's example comment, with the words that trigger it marked.
function TriggerComment({ template }: { template: CampaignTemplate }) {
  const keywords = new Set(template.keywords.map((word) => word.toLowerCase()));
  return (
    <>
      {template.triggerExample.split(/(\s+)/).map((part, index) =>
        keywords.has(part.toLowerCase()) ? (
          <span key={index} className="rounded-md bg-sky px-1 font-semibold text-ink">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function TemplateVisual({ template, compact = false }: TemplateVisualProps) {
  const name = followerName(template);

  return (
    <div
      role="img"
      aria-label={`A follower comments "${template.triggerExample}" and gets a private reply: ${template.privateReplyPreview}`}
      className="w-full"
    >
      <div
        className={`flex items-start gap-3 bg-white text-ink ${
          compact ? "rounded-[20px] p-4" : "rounded-[28px] p-5 shadow-[0_24px_60px_-28px_rgba(11,30,91,0.35)]"
        }`}
      >
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-signal text-xs font-bold text-white"
        >
          {name[0]}
        </span>
        <p className="min-w-0 text-[15px] leading-snug">
          <span className="font-semibold">{name.toLowerCase()}</span>{" "}
          <span className="text-slate">
            <TriggerComment template={template} />
          </span>
        </p>
      </div>

      <div
        className={`relative bg-ink text-white ${
          compact ? "-mt-2 ml-5 rounded-[20px] p-4" : "-mt-3 ml-8 rounded-[28px] p-5 shadow-[0_30px_70px_-30px_rgba(11,30,91,0.7)]"
        }`}
      >
        <p className="text-sm text-white/60">Message to {name.toLowerCase()}</p>
        <p
          className={`mt-2.5 rounded-[18px] rounded-bl-md bg-white px-4 py-3 leading-snug text-ink ${
            compact ? "text-sm" : "text-[15px]"
          }`}
        >
          {template.privateReplyPreview}
        </p>
      </div>
    </div>
  );
}
