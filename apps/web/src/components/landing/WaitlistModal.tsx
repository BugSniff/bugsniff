"use client";

import { useState, useEffect, useRef } from "react";

interface WaitlistModalProps {
  open: boolean;
  source: string;
  onClose: () => void;
}

type State = "idle" | "loading" | "success" | "error";

export default function WaitlistModal({
  open,
  source,
  onClose,
}: WaitlistModalProps) {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setState("idle");
        setEmail("");
        setFeedback("");
        setErrorMsg("");
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), feedback: feedback.trim(), source }),
      });

      const data = await res.json();

      if (res.ok) {
        setState("success");
      } else {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.15s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-xl border border-[#1f1f1f] bg-[#111111] shadow-2xl"
        style={{ animation: "slideUp 0.2s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1f1f1f]">
          <div>
            <h2
              className="text-base font-semibold text-[#ededed]"
              style={{ fontFamily: "var(--font-geist)" }}
            >
              Entrar na lista de espera
            </h2>
            <p className="text-xs text-[#a3a3a3] mt-0.5">
              Te avisamos quando o BugSniff abrir.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a3a3a3] hover:text-[#ededed] transition-colors cursor-pointer p-1 rounded hover:bg-[#1a1a1a]"
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
            <div className="w-12 h-12 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#ededed] mb-1" style={{ fontFamily: "var(--font-geist)" }}>
                Você está na lista!
              </h3>
              <p className="text-sm text-[#a3a3a3]">
                Te avisamos por email assim que o BugSniff abrir.
                <br />
                Obrigado pelo interesse!
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 text-sm text-[#a3a3a3] hover:text-[#ededed] border border-[#1f1f1f] rounded-md hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="waitlist-email"
                className="text-xs font-medium text-[#a3a3a3]"
              >
                Email <span className="text-[#ef4444]">*</span>
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
                className="w-full px-3 py-2.5 text-sm rounded-md border border-[#262626] bg-[#0a0a0a] text-[#ededed] placeholder-[#404040] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-colors disabled:opacity-50"
              />
            </div>

            {/* Feedback */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="waitlist-feedback"
                className="text-xs font-medium text-[#a3a3a3]"
              >
                Qual seu maior desafio com bugs?{" "}
                <span className="text-[#404040]">(opcional)</span>
              </label>
              <textarea
                id="waitlist-feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: testers não conseguem descrever o contexto, bugs não reproduzíveis..."
                rows={3}
                disabled={state === "loading"}
                className="w-full px-3 py-2.5 text-sm rounded-md border border-[#262626] bg-[#0a0a0a] text-[#ededed] placeholder-[#404040] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Error */}
            {state === "error" && (
              <div className="flex items-center gap-2 text-xs text-[#ef4444] bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-md px-3 py-2">
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
              className="w-full py-2.5 px-4 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {state === "loading" ? (
                <>
                  <svg
                    className="animate-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Enviando...
                </>
              ) : (
                "Me avise quando estiver pronto"
              )}
            </button>

            <p className="text-[10px] text-[#404040] text-center">
              Sem spam. Apenas um aviso quando o produto abrir.
            </p>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
