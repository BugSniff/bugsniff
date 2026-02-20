"use client";

import { useState, useEffect, useRef } from "react";

interface WaitlistModalProps {
  open: boolean;
  source: string;
  onClose: () => void;
}

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistModal({ open, source, onClose }: WaitlistModalProps) {
  const [email, setEmail]       = useState("");
  const [feedback, setFeedback] = useState("");
  const [state, setState]       = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => { setState("idle"); setEmail(""); setFeedback(""); setErrorMsg(""); }, 300);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res  = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feedback: feedback.trim(), source }),
      });
      const data = await res.json();
      if (res.ok) { setState("success"); }
      else {
        setState("error");
        setErrorMsg(data.error || "Algo deu errado. Tente novamente.");
      }
    } catch {
      setState("error");
      setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-geist text-base font-semibold text-primary">
              Entrar na lista de espera
            </h2>
            <p className="text-xs text-secondary mt-0.5">Te avisamos quando o BugSniff abrir.</p>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors cursor-pointer p-1 rounded hover:bg-surface-hover"
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {state === "success" ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3 className="font-geist text-base font-semibold text-primary mb-1">Você está na lista!</h3>
              <p className="text-sm text-secondary">
                Te avisamos por email assim que o BugSniff abrir.<br />Obrigado pelo interesse!
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 text-sm text-secondary hover:text-primary border border-border rounded-md hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="waitlist-email" className="text-xs font-medium text-secondary">
                Email <span className="text-error">*</span>
              </label>
              <input
                ref={inputRef}
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                disabled={state === "loading"}
                className="w-full px-3 py-2.5 text-sm rounded-md border border-border-strong bg-page text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="waitlist-feedback" className="text-xs font-medium text-secondary">
                Qual seu maior desafio com bugs?{" "}
                <span className="text-muted">(opcional)</span>
              </label>
              <textarea
                id="waitlist-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: testers não conseguem descrever o contexto, bugs não reproduzíveis..."
                rows={3}
                disabled={state === "loading"}
                className="w-full px-3 py-2.5 text-sm rounded-md border border-border-strong bg-page text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {state === "error" && (
              <div className="flex items-center gap-2 text-xs text-error bg-error/5 border border-error/20 rounded-md px-3 py-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={state === "loading" || !email.trim()}
              className="w-full py-2.5 px-4 rounded-md bg-accent hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {state === "loading" ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Enviando...
                </>
              ) : (
                "Me avise quando estiver pronto"
              )}
            </button>

            <p className="text-[10px] text-muted text-center">
              Sem spam. Apenas um aviso quando o produto abrir.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
