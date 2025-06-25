import { Navbar } from "../components/landing/navbar";
import { HeroSection } from "../components/landing/hero-section";
import { FeaturesSection } from "../components/landing/features-section";
// import { HowItWorks } from "../components/landing/how-it-works";
// import { PricingSection } from "../components/landing/pricing-section";
import { Footer } from "../components/landing/footer";

export default function Home() {
  return (
    <div className="w-full">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <FeaturesSection />
        {/* <HowItWorks /> */}
        {/* <PricingSection /> */}
      </main>
      <Footer />
    </div>
  );
}
