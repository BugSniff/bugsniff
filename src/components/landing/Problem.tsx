import { content, type Locale } from "@/lib/content";

interface ProblemProps {
  locale?: Locale;
}

export default function Problem({ locale = "pt" }: ProblemProps) {
  const t = content[locale].problem;

  return (
    <section className="py-24 px-6 border-t border-border bg-page-alt">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-geist text-3xl sm:text-4xl font-bold text-primary mb-4">
            {t.title}
          </h2>
          <p className="text-secondary text-base max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {t.stats.map((stat, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-6 flex flex-col gap-2">
              <div className="font-geist text-4xl font-bold text-accent">{stat.value}</div>
              <div className="text-sm font-medium text-primary">{stat.label}</div>
              <div className="text-xs text-secondary leading-relaxed">{stat.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h3 className="text-sm font-semibold text-primary mb-4">{t.soundFamiliar}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {t.painPoints.map((quote, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-secondary">
                <span className="text-error mt-0.5 shrink-0">✕</span>
                <span className="italic">{quote}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
