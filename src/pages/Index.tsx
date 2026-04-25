import { Navbar } from "@/components/Navbar";
import { TrialBanner } from "@/components/TrialBanner";
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
      <TrialBanner />
      <main id="main">
        <Hero />
        <LiveGamesBoard />
        <DailyResults />
        <OddsComparison />
        <CrowdWisdom />
        <CrowdFeed />
        <AIRecommendations />
        <div id="pricing"><PricingSection /></div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
