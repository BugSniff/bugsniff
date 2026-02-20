"use client";

import { useState, useRef } from "react";
import { content, type Locale } from "@/lib/content";

type Step = "open" | "closed" | "sending" | "replaying" | "creating" | "ticketing";

const activityData = [
  20, 35, 55, 30, 70, 45, 25, 60, 40, 80,
  35, 50, 65, 20, 75, 45, 30, 55, 40, 70,
  25, 60, 35, 80, 45, 55, 30, 65, 20, 75,
  50, 35, 60, 45, 25, 70, 40, 55, 30, 65,
];

const logEventStyles = [
  { icon: "↖", iconCls: "text-accent", labelCls: "text-secondary", t: "00:41" },
  { icon: "✕", iconCls: "text-error",  labelCls: "text-error",     t: "00:42" },
  { icon: "⇅", iconCls: "text-error",  labelCls: "text-error",     t: "00:42" },
];

interface WidgetDemoProps {
  onTicketCreated?: () => void;
  onClose?: () => void;
  locale?: Locale;
}

export default function WidgetDemo({ onTicketCreated, onClose, locale = "pt" }: WidgetDemoProps) {
  const t = content[locale].widget;
  const [step, setStep] = useState<Step>("closed");
  const isOpen = step !== "closed";

  const toggle = () => {
    if (isOpen) {
      setStep("closed");
      onClose?.();
    } else {
      setStep("open");
    }
  };

  const handleSendReport = () => {
    setStep("sending");
    setTimeout(() => setStep("replaying"), 900);
  };

  const handleCreateTicket = () => {
    setStep("creating");
    setTimeout(() => {
      setStep("ticketing");
      onTicketCreated?.();
    }, 1200);
  };

  return (
    <div className="relative h-[380px] rounded-md overflow-hidden select-none border border-border bg-page ">
      {/* Fake browser bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-page-alt">
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="w-2 h-2 rounded-full bg-border-strong" />
        <span className="ml-2 text-[9px] font-mono text-muted">seusite.com.br/checkout</span>
      </div>

      {/* Fake page content — background skeleton */}
      <div className="absolute inset-x-0 top-[29px] bottom-0 p-4 space-y-2 opacity-30 pointer-events-none">
        <div className="h-3 w-1/3 rounded bg-inset" />
        <div className="h-2 w-1/2 rounded bg-inset" />
        <div className="h-2 w-2/5 rounded bg-inset" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-14 rounded bg-inset" />
          <div className="h-14 rounded bg-inset" />
        </div>
        <div className="h-2 w-3/4 rounded bg-inset" />
        <div className="h-2 w-1/2 rounded bg-inset" />
        <div className="mt-2 h-7 w-1/3 rounded bg-surface-hover" />
      </div>

      {/* Floating widget — bottom-right corner */}
      <div className="absolute bottom-4 right-4 flex items-end gap-3 max-[490px]:flex-col max-[490px]:bottom-2 ">
        {/* Widget panel */}
        {isOpen && (
          <div className="w-72 rounded-xl bg-surface border border-border shadow-2xl overflow-hidden animate-slide-up-widget">
            {step === "open"      && <OpenState onSend={handleSendReport} t={t} />}
            {step === "sending"   && <SendingState label={t.capturingLabel} sub={t.capturingSub} />}
            {step === "replaying" && <ReplayingState onCreateTicket={handleCreateTicket} t={t} />}
            {step === "creating"  && <SendingState label={t.creatingLabel} sub={t.creatingSub} />}
            {step === "ticketing" && <TicketingState t={t} />}
          </div>
        )}

        {/* Toggle button + hint arrow */}
        <div className="relative">
          {/* Hint — only visible on initial state */}
          {step === "closed" && (
            <div className="absolute bottom-full right-0 mb-2 flex flex-col items-end gap-1 pointer-events-none animate-fade-in">
              <span className="text-[9px] text-accent font-mono whitespace-nowrap bg-surface/90 px-2 py-1 rounded-md border border-border/60">
                {t.hint}
              </span>
              <svg
                className="text-accent animate-bounce mr-3"
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={toggle}
            title={isOpen ? t.openTitle : t.closedTitle}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer ${isOpen
              ? "bg-accent hover:bg-accent-dark"
              : "bg-surface border border-border hover:border-accent"
              }`}
          >
            <BugIconSm color={isOpen ? "white" : "#a3a3a3"} />
            {isOpen && (
              <span className="absolute inset-0 rounded-full border border-accent animate-ping opacity-20" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── States ─────────────────────────────────────────── */

type WidgetT = typeof content.pt.widget;

function OpenState({ onSend, t }: { onSend: () => void; t: WidgetT }) {
  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-[11px] font-medium text-primary">BugSniff</span>
        <span className="text-[10px] text-muted ml-0.5">{t.readyLabel}</span>
      </div>
      <div className="rounded border border-border bg-inset px-3 py-2">
        <p className="text-[10px] text-muted font-mono">
          {t.reportPlaceholder}
        </p>
      </div>
      <button
        onClick={onSend}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-[11px] font-medium bg-accent hover:bg-accent-dark text-white transition-colors cursor-pointer"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        {t.sendBtn}
      </button>
    </div>
  );
}

function SendingState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="px-4 py-6 flex flex-col items-center gap-2 animate-fade-in">
      <svg className="animate-spin text-accent" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <p className="text-[10px] text-secondary">{label}</p>
      <p className="text-[9px] text-muted">{sub}</p>
    </div>
  );
}

function ReplayingState({ onCreateTicket, t }: { onCreateTicket: () => void; t: WidgetT }) {
  const [leftPct, setLeftPct] = useState(28);
  const [rightPct, setRightPct] = useState(84);
  const leftRef = useRef(28);
  const rightRef = useRef(84);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"left" | "right" | null>(null);

  const updateLeft = (v: number) => { leftRef.current = v; setLeftPct(v); };
  const updateRight = (v: number) => { rightRef.current = v; setRightPct(v); };

  const onHandleMouseDown = (handle: "left" | "right") => (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = handle;
    const onMove = (ev: MouseEvent) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      if (dragging.current === "left") updateLeft(Math.min(pct, rightRef.current - 8));
      else updateRight(Math.max(pct, leftRef.current + 8));
    };
    const onUp = () => {
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="px-4 py-3 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-[11px] font-medium text-primary">{t.replayCaptured}</span>
        <span className="ml-auto text-[9px] text-muted font-mono">{t.replayMeta}</span>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <p className="text-[9px] font-mono text-muted uppercase tracking-widest">{t.timelineLabel}</p>
        <div ref={trackRef} className="relative h-11 rounded overflow-hidden bg-inset cursor-ew-resize">
          <div className="absolute inset-0 flex items-end gap-px pb-px px-px pointer-events-none">
            {activityData.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-border-strong" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 bg-page/55 pointer-events-none" style={{ width: `${leftPct}%` }} />
          <div className="absolute inset-y-0 right-0 bg-page/55 pointer-events-none" style={{ left: `${rightPct}%` }} />
          <div className="absolute inset-y-0 bg-accent/15 pointer-events-none" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
          <div className="absolute inset-y-0 w-[2px] bg-accent z-10 cursor-ew-resize" style={{ left: `${leftPct}%` }} onMouseDown={onHandleMouseDown("left")}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-b" />
          </div>
          <div className="absolute inset-y-0 w-[2px] bg-accent z-10 cursor-ew-resize" style={{ left: `${rightPct}%` }} onMouseDown={onHandleMouseDown("right")}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-b" />
          </div>
        </div>
        <div className="flex justify-between text-[8px] font-mono text-muted">
          <span>00:00</span><span>00:14</span><span>00:28</span><span>00:42</span>
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-1">
        <p className="text-[9px] font-mono text-muted uppercase tracking-widest">{t.logsLabel}</p>
        <div className="rounded border border-border bg-inset divide-y divide-border">
          {logEventStyles.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 text-[9px] font-mono">
              <span className={ev.iconCls}>{ev.icon}</span>
              <span className="text-muted w-8 shrink-0">{ev.t}</span>
              <span className={`truncate ${ev.labelCls}`}>{t.logLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create ticket */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 rounded border border-border bg-inset px-2.5 py-1.5 text-[10px] font-mono text-secondary truncate">
          {t.ticketLabel}
        </div>
        <button
          onClick={onCreateTicket}
          className="px-3 py-1.5 rounded text-[10px] font-medium bg-accent hover:bg-accent-dark text-white transition-colors cursor-pointer shrink-0"
        >
          {t.sendTicketBtn}
        </button>
      </div>
    </div>
  );
}

function TicketingState({ t }: { t: WidgetT }) {
  return (
    <div className="px-4 py-5 flex flex-col items-center gap-2 text-center animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-success/15 border border-success/25 flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-[11px] text-primary font-medium">{t.ticketCreated}</p>
      <p className="text-[10px] text-secondary font-mono">{t.ticketRef}</p>
      <p className="text-[9px] text-muted">{t.ticketNote}</p>
    </div>
  );
}

function BugIconSm({ color = "white" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
    </svg>
  );
}
