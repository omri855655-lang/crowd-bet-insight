import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveGamesBoard } from "@/components/LiveGamesBoard";
import { CrowdWisdom } from "@/components/CrowdWisdom";
import { OddsComparison } from "@/components/OddsComparison";
import { CrowdFeed } from "@/components/CrowdFeed";
import { DailyResults } from "@/components/DailyResults";
import { AIRecommendations } from "@/components/AIRecommendations";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main">
        <Hero />
        <LiveGamesBoard />
        <DailyResults />
        <OddsComparison />
        <CrowdWisdom />
        <CrowdFeed />
        <AIRecommendations />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
