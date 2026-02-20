const stats = [
  {
    value: "30%",
    label: "dos bugs reportados",
    desc: "não são reproduzíveis pelo dev que recebe o report.",
  },
  {
    value: "3×",
    label: "mais tempo de fix",
    desc: "quando o report chega sem logs de rede e console.",
  },
  {
    value: "2–4h",
    label: "por sprint desperdiçadas",
    desc: 'em loops de "não consigo reproduzir" entre dev e tester.',
  },
];

export default function Problem() {
  return (
    <section className="py-24 px-6 border-t border-[#1f1f1f] bg-[#0d0d0d]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#ededed] mb-4"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            O bug chega. O contexto, não.
          </h2>
          <p className="text-[#a3a3a3] text-base max-w-xl mx-auto">
            Tester clica, dev não vê. O ciclo come horas de desenvolvimento que
            poderiam ir para features.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6 flex flex-col gap-2"
            >
              <div
                className="text-4xl font-bold text-[#3b82f6]"
                style={{ fontFamily: "var(--font-geist)" }}
              >
                {stat.value}
              </div>
              <div className="text-sm font-medium text-[#ededed]">
                {stat.label}
              </div>
              <div className="text-xs text-[#a3a3a3] leading-relaxed">
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Pain points list */}
        <div className="mt-10 rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
          <h3 className="text-sm font-semibold text-[#ededed] mb-4">
            Soa familiar?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "\"Não consigo reproduzir esse bug\"",
              "\"Qual versão do browser você estava usando?\"",
              "\"Pode gravar um vídeo e mandar?\"",
              "\"Que chamada de API estava fazendo?\"",
              "\"Qual era o erro no console?\"",
              "\"Pode me dar os passos exatos para reproduzir?\"",
            ].map((quote, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs text-[#a3a3a3]"
              >
                <span className="text-[#ef4444] mt-0.5 shrink-0">✕</span>
                <span className="italic">{quote}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
