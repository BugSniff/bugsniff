import type { Metadata } from "next";

const BASE_URL = "https://bugsniff.com.br";
const TITLE_EN = "BugSniff — Your user found the bug. You get the replay.";
const DESCRIPTION_EN =
  "Drop a script into your SaaS in 30 seconds. Every bug report comes with a session replay, network and console logs — no back-and-forth.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE_EN,
    template: "%s | BugSniff",
  },
  description: DESCRIPTION_EN,
  keywords: [
    "bug report",
    "session replay",
    "bug tracking",
    "SaaS debugging",
    "error monitoring",
    "console logs",
    "network logs",
    "bug reporting tool",
    "error tracking",
    "debug tool",
    "BugSniff",
  ],
  authors: [{ name: "BugSniff", url: BASE_URL }],
  creator: "BugSniff",
  publisher: "BugSniff",
  alternates: {
    canonical: `${BASE_URL}/en`,
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
    title: TITLE_EN,
    description: DESCRIPTION_EN,
    url: `${BASE_URL}/en`,
    siteName: "BugSniff",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_EN,
    description: DESCRIPTION_EN,
    site: "@bugsniff",
    creator: "@bugsniff",
  },
  category: "technology",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
