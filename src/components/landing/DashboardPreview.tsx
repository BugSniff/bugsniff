import { content, type Locale } from "@/lib/content";

const networkLogs = [
  { method: "GET",  path: "/api/user",     status: "200", time: "42ms" },
  { method: "GET",  path: "/api/cart",     status: "200", time: "67ms" },
  { method: "POST", path: "/api/checkout", status: "422", time: "234ms" },
  { method: "GET",  path: "/api/payment",  status: "500", time: "12ms" },
];

const consoleLogs = [
  { type: "log",   msg: "Cart loaded: 3 items" },
  { type: "warn",  msg: "Payment method not selected" },
  { type: "error", msg: "TypeError: Cannot read properties of undefined (reading 'id')" },
  { type: "error", msg: "Unhandled Promise Rejection: checkout failed" },
];

const typeIconCls: Record<string, { icon: string; textCls: string }> = {
  click:   { icon: "↖", textCls: "text-accent" },
  network: { icon: "⇅", textCls: "text-secondary" },
  error:   { icon: "✕", textCls: "text-error" },
};

const consoleTypeCls: Record<string, string> = {
  log:   "text-secondary",
  warn:  "text-warning",
  error: "text-error",
};

interface DashboardPreviewProps {
  locale?: Locale;
}

export default function DashboardPreview({ locale = "pt" }: DashboardPreviewProps) {
  const t = content[locale].dashboard;

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

        {/* Dashboard mockup */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Titlebar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-page-alt">
            <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
            <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
            <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
            <span className="ml-3 text-xs text-secondary font-mono">
              {t.ticketTitle}
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-error/10 text-error border border-error/20 font-mono">
              open
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: replay + timeline */}
            <div className="lg:col-span-3 p-4 space-y-3">
              {/* Replay player */}
              <div>
                <div className="text-[10px] text-secondary mb-2 font-mono uppercase tracking-wider">
                  {t.replayLabel}
                </div>
                <div className="rounded-lg bg-page border border-border h-40 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex flex-col">
                    <div className="h-6 bg-page-alt border-b border-border flex items-center px-3 gap-2">
                      <span className="text-[9px] font-mono text-secondary">◀ ▶</span>
                      <span className="text-[9px] font-mono text-secondary bg-inset px-2 py-0.5 rounded flex-1">
                        loja.exemplo.com/checkout
                      </span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <div className="h-3 w-1/2 rounded bg-surface-hover" />
                      <div className="h-2 w-3/4 rounded bg-inset" />
                      <div className="h-2 w-2/3 rounded bg-inset" />
                      <div className="mt-2 flex gap-2">
                        <div className="h-7 flex-1 rounded bg-surface-hover" />
                        <div className="h-7 w-16 rounded bg-accent/30 border border-accent/40" />
                      </div>
                    </div>
                  </div>
                  {/* Playhead */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="h-1 bg-border rounded-full">
                      <div className="h-full bg-accent rounded-full" style={{ width: "42%" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-mono text-secondary">00:42</span>
                      <span className="text-[9px] font-mono text-secondary">02:15</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-[10px] text-secondary mb-2 font-mono uppercase tracking-wider">
                  {t.timelineLabel}
                </div>
                <div className="space-y-1.5">
                  {t.timelineEvents.map((ev, i) => {
                    const { icon, textCls } = typeIconCls[ev.type];
                    const isError = ev.type === "error";
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 text-xs rounded px-2 py-1.5 ${
                          isError
                            ? "bg-error/5 border border-error/10"
                            : "bg-page border border-border"
                        }`}
                      >
                        <span className={`font-mono text-[10px] shrink-0 ${textCls}`}>{icon}</span>
                        <span className="text-secondary font-mono text-[10px] shrink-0">{ev.t}</span>
                        <span className={`text-[11px] ${isError ? "text-error" : "text-primary"}`}>
                          {ev.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: network + console + metadata */}
            <div className="lg:col-span-2 divide-y divide-border">
              {/* Network */}
              <div className="p-4">
                <div className="text-[10px] text-secondary mb-2 font-mono uppercase tracking-wider">
                  {t.networkLabel}
                </div>
                <div className="space-y-1.5">
                  {networkLogs.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-secondary w-8 shrink-0">{r.method}</span>
                      <span className="text-primary flex-1 truncate">{r.path}</span>
                      <span className="text-secondary shrink-0">{r.time}</span>
                      <span className={`shrink-0 ${r.status.startsWith("2") ? "text-success" : "text-error"}`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console */}
              <div className="p-4">
                <div className="text-[10px] text-secondary mb-2 font-mono uppercase tracking-wider">
                  {t.consoleLabel}
                </div>
                <div className="space-y-1.5">
                  {consoleLogs.map((l, i) => {
                    const cls = consoleTypeCls[l.type] ?? "text-secondary";
                    return (
                      <div key={i} className="flex items-start gap-2 text-[10px] font-mono">
                        <span className={`shrink-0 uppercase ${cls}`}>{l.type}</span>
                        <span className={`leading-relaxed ${cls}`}>{l.msg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4">
                <div className="text-[10px] text-secondary mb-2 font-mono uppercase tracking-wider">
                  {t.metaLabel}
                </div>
                <div className="space-y-1">
                  {t.metaRows.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[10px]">
                      <span className="text-secondary shrink-0 w-16 font-mono">{k}</span>
                      <span className="text-primary font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
