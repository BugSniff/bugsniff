import { content, type Locale } from "@/lib/content";

interface HowItWorksProps {
  locale?: Locale;
}

export default function HowItWorks({ locale = "pt" }: HowItWorksProps) {
  const t = content[locale].howItWorks;

  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-geist text-3xl sm:text-4xl font-bold text-primary mb-4">
            {t.title}
          </h2>
          <p className="text-secondary text-base max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Script column */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-page border border-border text-accent">
                {t.scriptBadge}
              </span>
              <h3 className="text-sm font-semibold text-primary">{t.scriptTitle}</h3>
            </div>
            <div className="space-y-5">
              {t.scriptSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-accent mt-0.5 shrink-0 w-6">{step.n}</span>
                  <div>
                    <div className="text-sm font-medium text-primary mb-0.5">{step.title}</div>
                    <div className="text-xs text-secondary leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extension column */}
          <div className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-page border border-border text-accent">
                {t.testerBadge}
              </span>
              <h3 className="text-sm font-semibold text-primary">{t.testerTitle}</h3>
            </div>
            <div className="space-y-5">
              {t.testerSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-accent mt-0.5 shrink-0 w-6">{step.n}</span>
                  <div>
                    <div className="text-sm font-medium text-primary mb-0.5">{step.title}</div>
                    <div className="text-xs text-secondary leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
