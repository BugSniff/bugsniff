const networkLogs = [
  { method: "GET", path: "/api/user", status: "200", time: "42ms" },
  { method: "GET", path: "/api/cart", status: "200", time: "67ms" },
  { method: "POST", path: "/api/checkout", status: "422", time: "234ms" },
  { method: "GET", path: "/api/payment", status: "500", time: "12ms" },
];

const consoleLogs = [
  { type: "log", msg: "Cart loaded: 3 items" },
  { type: "warn", msg: "Payment method not selected" },
  { type: "error", msg: "TypeError: Cannot read properties of undefined (reading 'id')" },
  { type: "error", msg: "Unhandled Promise Rejection: checkout failed" },
];

const timelineEvents = [
  { type: "click", label: "Clique em 'Finalizar compra'", t: "00:38" },
  { type: "network", label: "POST /api/checkout → 422", t: "00:39" },
  { type: "error", label: "TypeError: Cannot read 'id'", t: "00:39" },
  { type: "network", label: "GET /api/payment → 500", t: "00:40" },
  { type: "click", label: "Clique em 'Tentar novamente'", t: "00:42" },
];

const typeColors: Record<string, string> = {
  click: "#3b82f6",
  network: "#a3a3a3",
  error: "#ef4444",
};

const typeIcons: Record<string, string> = {
  click: "↖",
  network: "⇅",
  error: "✕",
};

export default function DashboardPreview() {
  return (
    <section className="py-24 px-6 border-t border-[#1f1f1f]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#ededed] mb-4"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            O que chega no dashboard
          </h2>
          <p className="text-[#a3a3a3] text-base max-w-xl mx-auto">
            Cada ticket tem tudo que o dev precisa para reproduzir e corrigir —
            sem perguntar mais nada.
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] overflow-hidden">
          {/* Titlebar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f1f1f] bg-[#0d0d0d]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#262626]" />
            <span className="ml-3 text-xs text-[#a3a3a3] font-mono">
              Checkout quebrado após seleção de endereço
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 font-mono">
              open
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#1f1f1f]">
            {/* Left: replay + timeline */}
            <div className="lg:col-span-3 p-4 space-y-3">
              {/* Replay player */}
              <div>
                <div className="text-[10px] text-[#a3a3a3] mb-2 font-mono uppercase tracking-wider">
                  Replay
                </div>
                <div className="rounded-lg bg-[#0a0a0a] border border-[#1f1f1f] h-40 flex items-center justify-center relative overflow-hidden">
                  {/* Simulated browser content */}
                  <div className="absolute inset-0 flex flex-col">
                    <div className="h-6 bg-[#0d0d0d] border-b border-[#1f1f1f] flex items-center px-3 gap-2">
                      <span className="text-[9px] font-mono text-[#a3a3a3]">
                        ◀ ▶
                      </span>
                      <span className="text-[9px] font-mono text-[#a3a3a3] bg-[#161616] px-2 py-0.5 rounded flex-1">
                        loja.exemplo.com/checkout
                      </span>
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2">
                      <div className="h-3 w-1/2 rounded bg-[#1a1a1a]" />
                      <div className="h-2 w-3/4 rounded bg-[#161616]" />
                      <div className="h-2 w-2/3 rounded bg-[#161616]" />
                      <div className="mt-2 flex gap-2">
                        <div className="h-7 flex-1 rounded bg-[#1a1a1a]" />
                        <div className="h-7 w-16 rounded bg-[#3b82f6]/30 border border-[#3b82f6]/40" />
                      </div>
                    </div>
                  </div>
                  {/* Playhead */}
                  <div className="absolute bottom-2 left-3 right-3">
                    <div className="h-1 bg-[#1f1f1f] rounded-full">
                      <div
                        className="h-full bg-[#3b82f6] rounded-full"
                        style={{ width: "42%" }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] font-mono text-[#a3a3a3]">
                        00:42
                      </span>
                      <span className="text-[9px] font-mono text-[#a3a3a3]">
                        02:15
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <div className="text-[10px] text-[#a3a3a3] mb-2 font-mono uppercase tracking-wider">
                  Timeline de eventos
                </div>
                <div className="space-y-1.5">
                  {timelineEvents.map((ev, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 text-xs rounded px-2 py-1.5 ${
                        ev.type === "error"
                          ? "bg-[#ef4444]/5 border border-[#ef4444]/10"
                          : "bg-[#0a0a0a] border border-[#1f1f1f]"
                      }`}
                    >
                      <span
                        className="font-mono text-[10px] shrink-0"
                        style={{ color: typeColors[ev.type] }}
                      >
                        {typeIcons[ev.type]}
                      </span>
                      <span className="text-[#a3a3a3] font-mono text-[10px] shrink-0">
                        {ev.t}
                      </span>
                      <span
                        className={`text-[11px] ${ev.type === "error" ? "text-[#ef4444]" : "text-[#ededed]"}`}
                      >
                        {ev.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: network + console + metadata */}
            <div className="lg:col-span-2 divide-y divide-[#1f1f1f]">
              {/* Network */}
              <div className="p-4">
                <div className="text-[10px] text-[#a3a3a3] mb-2 font-mono uppercase tracking-wider">
                  Network logs
                </div>
                <div className="space-y-1.5">
                  {networkLogs.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-[#a3a3a3] w-8 shrink-0">
                        {r.method}
                      </span>
                      <span className="text-[#ededed] flex-1 truncate">
                        {r.path}
                      </span>
                      <span className="text-[#a3a3a3] shrink-0">{r.time}</span>
                      <span
                        className={`shrink-0 ${
                          r.status.startsWith("2")
                            ? "text-[#22c55e]"
                            : "text-[#ef4444]"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Console */}
              <div className="p-4">
                <div className="text-[10px] text-[#a3a3a3] mb-2 font-mono uppercase tracking-wider">
                  Console logs
                </div>
                <div className="space-y-1.5">
                  {consoleLogs.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px] font-mono">
                      <span
                        className={`shrink-0 uppercase ${
                          l.type === "error"
                            ? "text-[#ef4444]"
                            : l.type === "warn"
                              ? "text-[#f59e0b]"
                              : "text-[#a3a3a3]"
                        }`}
                      >
                        {l.type}
                      </span>
                      <span
                        className={`leading-relaxed ${
                          l.type === "error"
                            ? "text-[#ef4444]"
                            : l.type === "warn"
                              ? "text-[#f59e0b]"
                              : "text-[#a3a3a3]"
                        }`}
                      >
                        {l.msg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-4">
                <div className="text-[10px] text-[#a3a3a3] mb-2 font-mono uppercase tracking-wider">
                  Metadata
                </div>
                <div className="space-y-1">
                  {[
                    ["Browser", "Chrome 131 / macOS 14"],
                    ["Viewport", "1440 × 900"],
                    ["URL", "/checkout?step=2"],
                    ["Reportado", "há 3 minutos"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 text-[10px]">
                      <span className="text-[#a3a3a3] shrink-0 w-16 font-mono">
                        {k}
                      </span>
                      <span className="text-[#ededed] font-mono">{v}</span>
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
