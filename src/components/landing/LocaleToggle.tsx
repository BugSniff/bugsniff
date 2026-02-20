"use client";

import Link from "next/link";
import type { Locale } from "@/lib/content";

interface LocaleToggleProps {
  locale: Locale;
  className?: string;
}

export default function LocaleToggle({ locale, className = "" }: LocaleToggleProps) {
  return (
    <div
      className={`flex items-center gap-1 text-sm font-medium ${className}`}
      role="group"
      aria-label="Switch language"
    >
      {locale === "pt" ? (
        <>
          <span className="text-primary">PT</span>
          <span className="text-muted">|</span>
          <Link
            href="/en"
            className="text-secondary hover:text-primary transition-colors"
          >
            EN
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/"
            className="text-secondary hover:text-primary transition-colors"
          >
            PT
          </Link>
          <span className="text-muted">|</span>
          <span className="text-primary">EN</span>
        </>
      )}
    </div>
  );
}
