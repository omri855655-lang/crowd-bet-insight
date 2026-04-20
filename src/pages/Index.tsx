import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { LiveGamesBoard } from "@/components/LiveGamesBoard";
import { CrowdWisdom } from "@/components/CrowdWisdom";
import { OddsComparison } from "@/components/OddsComparison";
import { CrowdFeed } from "@/components/CrowdFeed";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <LiveGamesBoard />
        <OddsComparison />
        <CrowdWisdom />
        <CrowdFeed />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
