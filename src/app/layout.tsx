import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const BASE_URL = "https://bugsniff.com.br";
const TITLE = "BugSniff — Seu usuário achou o bug. Você recebe o replay.";
const DESCRIPTION =
  "Cole um script no seu SaaS em 30 segundos. Cada bug report chega com sessão gravada, logs de rede e console — sem ida e volta.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE,
    template: "%s | BugSniff",
  },
  description: DESCRIPTION,
  keywords: [
    "bug report",
    "session replay",
    "gravação de sessão",
    "debug SaaS",
    "rastreamento de erros",
    "logs de console",
    "logs de rede",
    "relatório de bugs",
    "monitoramento de erros",
    "ferramenta de debug",
    "BugSniff",
  ],
  authors: [{ name: "BugSniff", url: BASE_URL }],
  creator: "BugSniff",
  publisher: "BugSniff",
  alternates: {
    canonical: BASE_URL,
    languages: {
      "pt-BR": BASE_URL,
      "en": `${BASE_URL}/en`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "BugSniff",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: "@bugsniff",
    creator: "@bugsniff",
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BugSniff",
  url: BASE_URL,
  description: DESCRIPTION,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
    availability: "https://schema.org/PreOrder",
  },
  publisher: {
    "@type": "Organization",
    name: "BugSniff",
    url: BASE_URL,
  },
  inLanguage: "pt-BR",
  featureList: [
    "Gravação de sessão de usuário",
    "Logs de rede automáticos",
    "Captura de logs de console",
    "Integração via script em 30 segundos",
    "Bug reports com contexto completo",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
