interface CtaSectionProps {
  onCta: () => void;
}

export default function CtaSection({ onCta }: CtaSectionProps) {
  return (
    <section className="py-24 px-6 border-t border-border bg-page-alt">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
        <h2 className="font-geist text-3xl sm:text-4xl font-bold text-primary">
          Chega de &quot;não consigo reproduzir&quot;
        </h2>
        <p className="text-secondary text-base leading-relaxed">
          BugSniff está em desenvolvimento. Entre na lista de espera e seja
          avisado quando abrir o acesso — e ajude a moldar o produto com seu
          feedback.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onCta}
            className="px-6 py-3 rounded-md bg-accent hover:bg-accent-dark text-white font-medium text-base transition-colors cursor-pointer"
          >
            Entrar na lista de espera
          </button>

        </div>

      </div>
    </section>
  );
}
