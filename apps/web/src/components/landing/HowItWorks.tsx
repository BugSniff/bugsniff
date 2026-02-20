const scriptSteps = [
  {
    n: "01",
    title: "Cola o script",
    desc: "Uma linha de código no seu HTML. Zero configuração adicional.",
  },
  {
    n: "02",
    title: "Visitante vê o widget",
    desc: 'Um botão flutuante aparece no canto da tela: "Reportar bug".',
  },
  {
    n: "03",
    title: "Reporta com contexto",
    desc: "Replay da sessão, logs de rede e console são capturados automaticamente.",
  },
  {
    n: "04",
    title: "Ticket no dashboard",
    desc: "Dev abre o ticket e reproduz o bug na primeira tentativa.",
  },
];

const testerSteps = [
  {
    n: "01",
    title: "Instala a extensão",
    desc: "Extensão Chrome disponível como .zip — sem precisar da Chrome Store.",
  },
  {
    n: "02",
    title: "Cola a API key",
    desc: "Dev gera a key no dashboard e envia para o tester. Configuração em 30s.",
  },
  {
    n: "03",
    title: "Navega e reporta",
    desc: "Grava a sessão completa. Seleciona o trecho do bug na timeline.",
  },
  {
    n: "04",
    title: "Ticket no dashboard",
    desc: "rrweb replay, network logs, console logs e metadata chegam juntos.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 border-t border-[#1f1f1f]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#ededed] mb-4"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            Como funciona
          </h2>
          <p className="text-[#a3a3a3] text-base max-w-xl mx-auto">
            Dois caminhos, um dashboard. Escolha o que faz mais sentido — ou
            use os dois.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Script column */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#0a0a0a] border border-[#1f1f1f] text-[#3b82f6]">
                {"<script>"}
              </span>
              <h3 className="text-sm font-semibold text-[#ededed]">
                Para seu site
              </h3>
            </div>
            <div className="space-y-5">
              {scriptSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-[#3b82f6] mt-0.5 shrink-0 w-6">
                    {step.n}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[#ededed] mb-0.5">
                      {step.title}
                    </div>
                    <div className="text-xs text-[#a3a3a3] leading-relaxed">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extension column */}
          <div className="rounded-xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#0a0a0a] border border-[#1f1f1f] text-[#3b82f6]">
                Chrome
              </span>
              <h3 className="text-sm font-semibold text-[#ededed]">
                Para seus testers
              </h3>
            </div>
            <div className="space-y-5">
              {testerSteps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-xs font-mono text-[#3b82f6] mt-0.5 shrink-0 w-6">
                    {step.n}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[#ededed] mb-0.5">
                      {step.title}
                    </div>
                    <div className="text-xs text-[#a3a3a3] leading-relaxed">
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
