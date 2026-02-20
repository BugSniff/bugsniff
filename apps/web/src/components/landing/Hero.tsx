interface HeroProps {
  onCta: () => void;
}

export default function Hero({ onCta }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-dot-grid">
      {/* Gradient overlay on the dot grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] pointer-events-none" />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <BugIcon />
          <span
            className="text-[#ededed] font-semibold text-base tracking-tight"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            BugSniff
          </span>
        </div>
        <button
          onClick={onCta}
          className="text-sm text-[#a3a3a3] hover:text-[#ededed] transition-colors cursor-pointer"
        >
          Entrar na lista →
        </button>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1f1f1f] bg-[#111111] text-xs text-[#a3a3a3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Em desenvolvimento — entre na lista de espera
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl font-bold tracking-tight text-[#ededed] leading-tight"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          Bug reports com{" "}
          <span className="text-[#3b82f6]">contexto real</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-[#a3a3a3] max-w-2xl leading-relaxed">
          Instale um script no site ou distribua a extensão para seu time. Os
          reports chegam com replay, rede e logs —{" "}
          <span className="text-[#ededed]">sem ida e volta.</span>
        </p>

        {/* CTA */}
        <button
          onClick={onCta}
          className="mt-2 px-6 py-3 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium text-base transition-colors cursor-pointer"
        >
          Entrar na lista de espera
        </button>

        {/* Two path cards */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl relative">
          {/* Glow behind cards */}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-[#3b82f6] rounded-3xl" />

          {/* Card: Para seu site */}
          <div className="rounded-lg border border-[#1f1f1f] bg-[#111111] p-5 text-left flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CodeIcon />
              <span className="text-sm font-medium text-[#ededed]">
                Para seu site
              </span>
            </div>
            <pre className="text-xs text-[#22c55e] font-mono bg-[#0a0a0a] rounded px-3 py-2 overflow-x-auto border border-[#1f1f1f]">
              {`<script src="cdn.bugsniff.com.br/v1/bugsniff.min.js"
  data-project-id="proj_xxx"
  async></script>`}
            </pre>
            <p className="text-xs text-[#a3a3a3]">
              Widget aparece para seus visitantes — reportam bugs ou feedbacks
              sem instalar nada.
            </p>
          </div>

          {/* Card: Para seus testers */}
          <div className="rounded-lg border border-[#1f1f1f] bg-[#111111] p-5 text-left flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ExtensionIcon />
              <span className="text-sm font-medium text-[#ededed]">
                Para seus testers
              </span>
            </div>
            <div className="bg-[#0a0a0a] rounded px-3 py-2 border border-[#1f1f1f]">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-xs text-[#a3a3a3] font-mono">
                  Gravando — bugsniff.com.br
                </span>
              </div>
              <div className="text-xs text-[#a3a3a3] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#3b82f6]">●</span>
                  <span className="font-mono">POST /api/checkout 422</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#ef4444]">✕</span>
                  <span className="font-mono">
                    TypeError: Cannot read &apos;id&apos;
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#a3a3a3]">
              API key no popup — timeline completa com rrweb, network e console.
            </p>
          </div>
        </div>

        {/* Dashboard mockup hint */}
        <div className="w-full max-w-2xl rounded-lg border border-[#1f1f1f] bg-[#111111] overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1f1f1f]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="ml-3 text-xs text-[#a3a3a3] font-mono">
              app.bugsniff.com.br/tickets/tkt_7f2a
            </span>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <div className="h-32 rounded bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="text-xs text-[#a3a3a3]">▶ Replay</div>
                  <div className="text-xs font-mono text-[#3b82f6]">
                    00:42 / 02:15
                  </div>
                </div>
              </div>
              <div className="h-12 rounded bg-[#0a0a0a] border border-[#1f1f1f] flex items-center px-3 gap-2 overflow-hidden">
                {[
                  "#3b82f6",
                  "#a3a3a3",
                  "#3b82f6",
                  "#ef4444",
                  "#a3a3a3",
                  "#3b82f6",
                ].map((c, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full flex-shrink-0"
                    style={{
                      height: `${8 + Math.random() * 16}px`,
                      background: c,
                    }}
                  />
                ))}
                <span className="text-[10px] text-[#a3a3a3] ml-1 font-mono">
                  Timeline
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="rounded bg-[#0a0a0a] border border-[#1f1f1f] p-2">
                <div className="text-[10px] text-[#a3a3a3] mb-1">Network</div>
                <div className="space-y-1">
                  {[
                    { method: "GET", path: "/api/user", status: "200" },
                    { method: "POST", path: "/api/checkout", status: "422" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-[#a3a3a3]">
                        {r.method}
                      </span>
                      <span className="text-[9px] font-mono text-[#ededed] truncate flex-1">
                        {r.path}
                      </span>
                      <span
                        className={`text-[9px] font-mono ${r.status.startsWith("2") ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded bg-[#0a0a0a] border border-[#1f1f1f] p-2">
                <div className="text-[10px] text-[#a3a3a3] mb-1">Console</div>
                <div className="text-[9px] font-mono text-[#ef4444]">
                  TypeError: Cannot read properties of undefined
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BugIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 4-4" />
      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
      <path d="M18 13h4" />
      <path d="M21 21c0-2.1-1.7-3.9-4-4" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ExtensionIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
