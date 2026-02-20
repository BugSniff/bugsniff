interface FooterProps {
  onCta: () => void;
}

export default function Footer({ onCta }: FooterProps) {
  return (
    <footer className="py-10 px-6 border-t border-[#1f1f1f]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BugIcon />
          <span
            className="text-sm font-semibold text-[#ededed]"
            style={{ fontFamily: "var(--font-geist)" }}
          >
            BugSniff
          </span>
          <span className="text-xs text-[#a3a3a3] ml-2">
            © {new Date().getFullYear()}
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs text-[#a3a3a3]">
          <a
            href="mailto:contato@bugsniff.com.br"
            className="hover:text-[#ededed] transition-colors"
          >
            contato@bugsniff.com.br
          </a>
          <button
            onClick={onCta}
            className="hover:text-[#ededed] transition-colors cursor-pointer"
          >
            Lista de espera
          </button>
        </div>
      </div>
    </footer>
  );
}

function BugIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2l1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
      <path d="M6 13H2" />
      <path d="M3 21c0-2.1 1.7-3.9 4-4" />
      <path d="M17.47 9c1.93-.2 3.53-1.9 3.53-4" />
      <path d="M18 13h4" />
      <path d="M21 21c0-2.1-1.7-3.9-4-4" />
    </svg>
  );
}
