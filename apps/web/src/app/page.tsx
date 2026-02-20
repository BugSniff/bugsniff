"use client";

import { useState } from "react";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Problem from "@/components/landing/Problem";
import DashboardPreview from "@/components/landing/DashboardPreview";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import WaitlistModal from "@/components/landing/WaitlistModal";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<string>("hero");

  function openModal(source: string) {
    setModalSource(source);
    setModalOpen(true);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#ededed]">
      <Hero onCta={() => openModal("hero")} />
      <HowItWorks />
      <Problem />
      <DashboardPreview />
      <CtaSection onCta={() => openModal("cta_section")} />
      <Footer onCta={() => openModal("footer")} />

      <WaitlistModal
        open={modalOpen}
        source={modalSource}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}
