import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BugSniff — Seu usuário achou o bug. Você recebe o replay.",
  description:
    "Cole um script no seu SaaS em 30 segundos. Cada bug report chega com sessão gravada, logs de rede e console — sem ida e volta.",
  metadataBase: new URL("https://bugsniff.com.br"),
  openGraph: {
    title: "BugSniff — Seu usuário achou o bug. Você recebe o replay.",
    description:
      "Cole um script no seu SaaS em 30 segundos. Cada bug report chega com sessão gravada, logs de rede e console — sem ida e volta.",
    url: "https://bugsniff.com.br",
    siteName: "BugSniff",
    locale: "pt_BR",
    type: "website",
  },
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
      <body>{children}</body>
    </html>
  );
}
