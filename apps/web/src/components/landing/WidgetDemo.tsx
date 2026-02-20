"use client";

import { useState } from "react";

type Step = "idle" | "open" | "recording" | "sending" | "done";

const timelineEvents = [
  { icon: "↖", iconCls: "text-accent",    labelCls: "text-secondary", label: "Clique no checkout",           t: "00:41" },
  { icon: "✕", iconCls: "text-error",     labelCls: "text-error",     label: "TypeError: Cannot read 'id'",  t: "00:42" },
  { icon: "⇅", iconCls: "text-secondary", labelCls: "text-secondary", label: "POST /api/checkout 422",       t: "00:42" },
];

export default function WidgetDemo() {
  const [step, setStep] = useState<Step>("idle");

  return (
    <div className="relative rounded-md bg-page border border-border overflow-hidden select-none">
      {/* Fake browser bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-page-alt">
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="ml-2 text-[9px] font-mono text-muted">seusite.com.br/checkout</span>
      </div>

      {/* Fake page content */}
      <div className="relative h-32">
        <div className="p-3 space-y-1.5">
          <div className="h-2 w-2/3 rounded bg-inset" />
          <div className="h-2 w-1/2 rounded bg-inset" />
          <div className="mt-2 flex gap-2">
            <div className="h-5 flex-1 rounded bg-inset" />
            <div className="h-5 w-12 rounded bg-surface-hover" />
          </div>
          <div className="h-2 w-3/4 rounded bg-inset" />
          <div className="h-2 w-1/3 rounded bg-inset" />
        </div>

        {/* Widget panel */}
        {step !== "idle" && (
          <div className="absolute inset-x-0 bottom-0 bg-surface border-t border-border rounded-t-lg shadow-xl animate-slide-up-widget">
            {step === "done" ? (
              <DoneState onReset={() => setStep("idle")} />
            ) : (
              <WidgetPanel step={step} onClose={() => setStep("idle")} onSend={() => { setStep("sending"); setTimeout(() => setStep("done"), 1400); }} setStep={setStep} />
            )}
          </div>
        )}

        {/* Floating widget button */}
        {step === "idle" && (
          <button
            onClick={() => setStep("open")}
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-accent hover:bg-accent-dark flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer animate-pop-in"
            title="Reportar bug"
          >
            <BugIconSm />
            <span className="absolute inset-0 rounded-full border border-accent animate-ping opacity-40" />
          </button>
        )}
      </div>
    </div>
  );
}

function WidgetPanel({
  step,
  onClose,
  onSend,
  setStep,
}: {
  step: Step;
  onClose: () => void;
  onSend: () => void;
  setStep: (s: Step) => void;
}) {
  return (
    <div className="px-3 py-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
          <span className="text-[10px] font-medium text-primary">
            {step === "recording" ? "Gravando…" : "BugSniff"}
          </span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-secondary transition-colors cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Timeline mini */}
      <div className="space-y-1">
        {timelineEvents.map((ev, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono">
            <span className={ev.iconCls}>{ev.icon}</span>
            <span className="text-muted">{ev.t}</span>
            <span className={`truncate ${ev.labelCls}`}>{ev.label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 pt-0.5">
        <button
          onClick={() => setStep("recording")}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium border transition-colors cursor-pointer ${
            step === "recording"
              ? "bg-error/10 border-error/30 text-error"
              : "bg-page border-border-strong text-secondary hover:border-accent hover:text-primary"
          }`}
        >
          {step === "recording" ? (
            <span className="w-1.5 h-1.5 rounded-sm bg-error" />
          ) : (
            <span className="text-[8px]">▶</span>
          )}
          {step === "recording" ? "Gravando" : "Replay"}
        </button>

        <button
          onClick={onSend}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[9px] font-medium bg-accent hover:bg-accent-dark text-white transition-colors cursor-pointer"
        >
          {step === "sending" ? (
            <svg className="animate-spin" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
          {step === "sending" ? "Enviando…" : "Enviar report"}
        </button>
      </div>
    </div>
  );
}

function DoneState({ onReset }: { onReset: () => void }) {
  return (
    <div className="px-3 py-3 flex flex-col items-center gap-1.5 text-center">
      <div className="w-6 h-6 rounded-full bg-success/15 border border-success/25 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-[10px] text-primary font-medium">Ticket criado!</p>
      <p className="text-[9px] text-secondary font-mono">#tkt_7f2a — replay anexado</p>
      <button
        onClick={onReset}
        className="mt-0.5 text-[9px] text-muted hover:text-secondary transition-colors cursor-pointer underline underline-offset-2"
      >
        Tentar de novo
      </button>
    </div>
  );
}

function BugIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
    </svg>
  );
}
