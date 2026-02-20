"use client";

import { useState, useRef } from "react";
import WidgetDemo from "./WidgetDemo";
import { content, type Locale } from "@/lib/content";

/* ─── Data ──────────────────────────────────────────────── */

const ticketActivityData = [
  15, 40, 60, 25, 75, 50, 30, 65, 35, 85,
  40, 55, 70, 25, 80, 50, 35, 60, 45, 75,
  20, 65, 40, 85, 50, 60, 35, 70, 25, 80,
  55, 40, 65, 50, 30, 75, 45, 60, 35, 70,
];

const ticketLogStyles = [
  { t: "00:38", color: "text-secondary" },
  { t: "00:41", color: "text-accent" },
  { t: "00:41", color: "text-success" },
  { t: "00:41", color: "text-success" },
  { t: "00:42", color: "text-warning" },
  { t: "00:42", color: "text-error" },
  { t: "00:42", color: "text-error" },
  { t: "00:42", color: "text-error" },
];

const consoleLogs: { prefix: string | null; cls: string; text: string }[] = [
  { prefix: "log",   cls: "text-secondary/60", text: "Cart loaded  {items: 3, total: 249.90}" },
  { prefix: "log",   cls: "text-secondary/60", text: "Applying coupon code PROMO10..." },
  { prefix: "log",   cls: "text-secondary/60", text: "Initiating checkout..." },
  { prefix: "warn",  cls: "text-warning",       text: "Missing required field: billing.address" },
  { prefix: "error", cls: "text-error",         text: "TypeError: Cannot read properties of undefined (reading 'id')" },
  { prefix: null,    cls: "text-error/50",      text: "    at CheckoutForm.handleSubmit (checkout.js:142:18)" },
  { prefix: null,    cls: "text-error/50",      text: "    at HTMLButtonElement.onClick (checkout.js:89:5)" },
  { prefix: null,    cls: "text-error/50",      text: "    at EventTarget.dispatchEvent (native)" },
];

/* ─── Hero ──────────────────────────────────────────────── */

interface HeroProps {
  onCta: () => void;
  locale?: Locale;
}

export default function Hero({ onCta, locale = "pt" }: HeroProps) {
  const t = content[locale].hero;
  const [ticketCreated, setTicketCreated] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-dot-grid">
      <div className="absolute inset-0 bg-linear-to-b from-page via-transparent to-page pointer-events-none" />

      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="BugSniff logo" className="h-6 w-auto" />
          <span className="font-geist text-primary font-semibold text-base tracking-tight">
            BugSniff
          </span>
        </div>
        <button
          onClick={onCta}
          className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {t.navCta}
        </button>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center gap-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-secondary">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {t.badge}
        </div>

        {/* Headline */}
        <h1 className="font-geist text-5xl sm:text-6xl font-bold tracking-tight text-primary leading-[1.1]">
          {t.h1Line1}
          <br />
          <span className="text-accent">{t.h1Line2}</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-secondary max-w-xl leading-relaxed">
          {t.sub}{" "}
          <span className="text-primary">{t.subHighlight}</span>
        </p>

        {/* CTA */}
        <button
          onClick={onCta}
          className="mt-2 px-6 py-3 rounded-md bg-accent hover:bg-accent-dark text-white font-medium text-base transition-colors cursor-pointer"
        >
          {t.cta}
        </button>

        {/* Widget card */}
        <div className="mt-4 w-full max-w-2xl relative">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-accent rounded-3xl" />
          <div className="rounded-lg border border-border bg-surface p-5 text-left flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CodeIcon />
              <span className="text-sm font-medium text-primary">{t.widgetCardLabel}</span>
            </div>
            <WidgetDemo
              locale={locale}
              onTicketCreated={() => setTicketCreated(true)}
              onClose={() => setTicketCreated(false)}
            />
            <p className="text-xs text-secondary">
              {t.widgetDesc}{" "}
              <span className="text-primary font-medium">{t.widgetDescBold}</span>{" "}
              {t.widgetDescSuffix}
            </p>
          </div>
        </div>

        {/* ── Ticket view — aparece após criar ticket ── */}
        {ticketCreated && (
          <div className="w-full max-w-2xl flex flex-col gap-3 animate-slide-up-widget">
            {/* Título */}
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <p className="text-xs text-secondary">
                {t.ticketEyebrow}{" "}
                <span className="text-primary font-medium">{t.ticketEyebrowBold}</span>
              </p>
            </div>

          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border">
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <span className="w-2.5 h-2.5 rounded-full bg-border-strong" />
              <span className="ml-3 text-xs text-secondary font-mono">
                app.bugsniff.com.br/tickets/tkt_7f2a
              </span>
            </div>

            <div className="p-5 space-y-5">

              {/* 1 · Badge + Título + Status + Timestamp */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-muted bg-inset px-1.5 py-0.5 rounded border border-border">
                    #tkt_7f2a
                  </span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-error/10 border border-error/20 text-error">
                    <span className="w-1 h-1 rounded-full bg-error animate-pulse" />
                    {t.ticketStatus}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-primary">{t.ticketTitle}</h3>
                <p className="text-[10px] text-muted font-mono">
                  {t.ticketMeta}
                </p>
              </div>

              {/* 2 · Replay placeholder */}
              <div className="relative h-40 rounded-lg overflow-hidden bg-page border border-border">
                {/* Atmosphere */}
                <div className="absolute inset-0 bg-linear-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />

                {/* Blurred frame thumbnails */}
                <div className="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
                  <div className="w-24 h-16 rounded-md bg-surface border border-border/40 opacity-20" />
                  <div className="w-32 h-20 rounded-md bg-surface border border-accent/30 opacity-30 ring-1 ring-accent/20 scale-105" />
                  <div className="w-24 h-16 rounded-md bg-surface border border-border/40 opacity-20" />
                </div>

                {/* Top gradient */}
                <div className="absolute inset-0 bg-linear-to-b from-page/50 via-transparent to-page/80 pointer-events-none" />

                {/* Play button + label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface/90 border border-border shadow-xl flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-accent ml-1">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-secondary font-medium">{t.replayLabel}</p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {t.replayMeta}
                    </p>
                  </div>
                </div>

                {/* Frame progress strip */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i < 9 ? "bg-accent/80" : i < 11 ? "bg-accent/30" : "bg-border-strong"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* 3 · Timeline com handles */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{t.timelineLabel}</p>
                <TicketTimeline activityData={ticketActivityData} />
              </div>

              {/* 4 · Logs */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{t.logsLabel}</p>
                <div className="rounded-lg border border-border bg-inset overflow-hidden divide-y divide-border">
                  {ticketLogStyles.map((style, i) => (
                    <div key={i} className="flex items-baseline gap-3 px-3 py-2 text-[10px] font-mono">
                      <span className="text-muted shrink-0 w-10">{style.t}</span>
                      <span className={`${style.color} break-all`}>{t.ticketLogTexts[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 · Console */}
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{t.consoleLabel}</p>
                <div className="rounded-lg overflow-hidden border border-border">
                  {/* Terminal bar */}
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-surface-hover bg-page-alt">
                    <span className="w-2.5 h-2.5 rounded-full bg-error/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-success/40" />
                    <span className="ml-2 text-[9px] font-mono text-muted">
                      console — seusite.com.br
                    </span>
                  </div>

                  {/* Console body */}
                  <div className="bg-[#050505] p-4 space-y-1 font-mono text-[10px] leading-relaxed">
                    {consoleLogs.map((line, i) => (
                      <div key={i} className="flex items-start gap-3">
                        {/* Prefix column */}
                        <span className="shrink-0 w-10 text-right">
                          {line.prefix === "log"   && <span className="text-muted/50">▸</span>}
                          {line.prefix === "warn"  && <span className="text-warning/70 text-[9px] font-bold">WARN</span>}
                          {line.prefix === "error" && <span className="text-error/70 text-[9px] font-bold">ERR</span>}
                        </span>
                        <span className={line.cls}>{line.text}</span>
                      </div>
                    ))}
                    {/* Blinking cursor */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="w-10 text-right text-muted/40 shrink-0">$</span>
                      <span className="inline-block w-2 h-[14px] bg-secondary/25 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── TicketTimeline ────────────────────────────────────── */

function TicketTimeline({ activityData }: { activityData: number[] }) {
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
    <div className="space-y-1.5">
      <div ref={trackRef} className="relative h-12 rounded-lg overflow-hidden bg-page border border-border cursor-ew-resize">
        {/* Activity bars */}
        <div className="absolute inset-0 flex items-end gap-px pb-px px-px pointer-events-none">
          {activityData.map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-border-strong" style={{ height: `${h}%` }} />
          ))}
        </div>
        {/* Dim overlays */}
        <div className="absolute inset-y-0 left-0 bg-page/60 pointer-events-none" style={{ width: `${leftPct}%` }} />
        <div className="absolute inset-y-0 right-0 bg-page/60 pointer-events-none" style={{ left: `${rightPct}%` }} />
        {/* Selected tint */}
        <div className="absolute inset-y-0 bg-accent/15 pointer-events-none" style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }} />
        {/* Left handle */}
        <div
          className="absolute inset-y-0 w-[2px] bg-accent z-10 cursor-ew-resize"
          style={{ left: `${leftPct}%` }}
          onMouseDown={onHandleMouseDown("left")}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-b" />
        </div>
        {/* Right handle */}
        <div
          className="absolute inset-y-0 w-[2px] bg-accent z-10 cursor-ew-resize"
          style={{ left: `${rightPct}%` }}
          onMouseDown={onHandleMouseDown("right")}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-b" />
        </div>
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted">
        <span>00:00</span>
        <span>00:14</span>
        <span>00:28</span>
        <span>00:42</span>
      </div>
    </div>
  );
}

/* ─── Icons ─────────────────────────────────────────────── */

function CodeIcon() {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="text-accent"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
