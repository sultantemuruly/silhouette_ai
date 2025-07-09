import { Navbar } from "../components/landing/navbar";
import { HeroSection } from "../components/landing/hero-section";
import { FeaturesSection } from "../components/landing/features-section";
// import { HowItWorks } from "../components/landing/how-it-works";
// import { PricingSection } from "../components/landing/pricing-section";
import { Footer } from "../components/landing/footer";
import YouTubeEmbed from "../components/video/youtube-embed";

export default function Home() {
  return (
    <div className="w-full">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <section className="py-20 bg-black/95">
          <div className="container px-4 md:px-6 flex flex-col items-center">
            <div className="w-full max-w-3xl aspect-video rounded-lg overflow-hidden border shadow-xl bg-black">
              <YouTubeEmbed videoId="YOKcO_PFCVE"/>
            </div>
          </div>
        </section>
        <FeaturesSection />
        {/* <HowItWorks /> */}
        {/* <PricingSection /> */}
      </main>
      <Footer />
    </div>
  );
}
