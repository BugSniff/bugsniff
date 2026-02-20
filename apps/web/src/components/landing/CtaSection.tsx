interface CtaSectionProps {
  onCta: () => void;
}

export default function CtaSection({ onCta }: CtaSectionProps) {
  return (
    <section className="py-24 px-6 border-t border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
        <h2
          className="text-3xl sm:text-4xl font-bold text-[#ededed]"
          style={{ fontFamily: "var(--font-geist)" }}
        >
          Chega de &quot;não consigo reproduzir&quot;
        </h2>
        <p className="text-[#a3a3a3] text-base leading-relaxed">
          BugSniff está em desenvolvimento. Entre na lista de espera e seja
          avisado quando abrir o acesso — e ajude a moldar o produto com seu
          feedback.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onCta}
            className="px-6 py-3 rounded-md bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium text-base transition-colors cursor-pointer"
          >
            Entrar na lista de espera
          </button>
          <a
            href="mailto:contato@bugsniff.com.br"
            className="text-sm text-[#a3a3a3] hover:text-[#ededed] transition-colors"
          >
            Ou fale direto →
          </a>
        </div>
        <div className="flex items-center gap-6 text-xs text-[#a3a3a3]">
          <span>✓ Gratuito para começar</span>
          <span>✓ Sem cartão de crédito</span>
          <span>✓ Aviso por email</span>
        </div>
      </div>
    </section>
  );
}
