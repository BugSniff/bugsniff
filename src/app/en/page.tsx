"use client";

import { useState } from "react";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Problem from "@/components/landing/Problem";
import DashboardPreview from "@/components/landing/DashboardPreview";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import WaitlistModal from "@/components/landing/WaitlistModal";

export default function HomeEN() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("hero");

  function openModal(source: string) {
    setModalSource(source);
    setModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-page text-primary">
      <Hero locale="en" onCta={() => openModal("hero")} />
      <HowItWorks locale="en" />
      <Problem locale="en" />
      <DashboardPreview locale="en" />
      <CtaSection locale="en" onCta={() => openModal("cta_section")} />
      <Footer locale="en" onCta={() => openModal("footer")} />

      <WaitlistModal
        locale="en"
        open={modalOpen}
        source={modalSource}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}
