
import AboutSection from "@/app/src/components/AboutSection";
import HeroSection from "@/app/src/components/HeroSection";
import StatsSection from "@/app/src/components/StatsSection";
import CaseSection from "@/app/src/components/CaseSectiion";
import SupportSection from "@/app/src/components/SupportSection";
import RunningtextSection from "@/app/src/components/RunningtextSection";
import Footer from "@/app/src/components/Footer";
import SecondHeroSection from "@/app/src/components/SecoondheroSection";



export default function HomePages() {
  return (
    <div className="w-full h-screen">
          <HeroSection />
          <AboutSection />
          <StatsSection />
          <CaseSection />
          <SupportSection />
          <RunningtextSection />
          <SecondHeroSection />
          <Footer />
      </div>
  );
}
