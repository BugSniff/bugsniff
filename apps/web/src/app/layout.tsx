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
  title: "BugSniff — Bug reports com contexto real",
  description:
    "Instale um script no site ou distribua a extensão para seu time. Os reports chegam com replay, rede e logs — sem ida e volta.",
  metadataBase: new URL("https://bugsniff.com.br"),
  openGraph: {
    title: "BugSniff — Bug reports com contexto real",
    description:
      "Bug reports que devs conseguem reproduzir. Replay completo, network logs, console — de testers ou dos seus próprios usuários.",
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
