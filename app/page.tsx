import { AgreementHero } from "@/components/landing/agreement-hero";
import { ClosingCTA } from "@/components/landing/closing-cta";
import { FeaturesSection } from "@/components/landing/features-section";
import { ForYouSection } from "@/components/landing/for-you-section";
import { LandingFaqSection } from "@/components/landing/faq-section";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { LandingTestimonialsSection } from "@/components/landing/testimonials-section";

export default function HomePage() {
  return (
    <main>
      <SiteHeader />
      <AgreementHero />
      <ForYouSection />
      <FeaturesSection />
      <HowItWorks />
      <LandingTestimonialsSection />
      <LandingFaqSection />
      <ClosingCTA />
      <SiteFooter />
    </main>
  );
}
