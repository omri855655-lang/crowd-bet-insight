import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const PricingSection = () => {
  const { lang } = useI18n();
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  const handleUpgrade = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toast.info(
      txt(
        "תשלומים יופעלו בקרוב — צור איתנו קשר",
        "Payments coming soon — contact us to upgrade"
      )
    );
  };

  const freeFeatures = [
    txt("לוח משחקים יומי", "Daily games board"),
    txt("השוואת יחסים בסיסית", "Basic odds comparison"),
    txt("דיווח הימורים לקהילה", "Report bets to community"),
    txt("צפייה בחכמת ההמונים", "View crowd wisdom"),
  ];

  const proFeatures = [
    txt("כל מה שיש בחינם +", "Everything in Free, plus:"),
    txt("יועץ AI אישי בלתי מוגבל", "Unlimited AI advisor"),
    txt("ניתוחי קהילה מתקדמים", "Advanced community analytics"),
    txt("התראות על תזוזות יחסים", "Live odds movement alerts"),
    txt("היסטוריה ואנליזה אישית", "Personal history & analysis"),
    txt("ללא פרסומות", "Ad-free experience"),
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-widest mb-3">
            <Crown className="w-4 h-4" />
            {txt("תמחור", "Pricing")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
            {txt("הצטרף לקהילה.", "Join the community.")}{" "}
            <span className="text-gradient-gold">
              {txt("שבוע ראשון חינם.", "First week free.")}
            </span>
          </h2>
          <p className="text-muted-foreground mt-3">
            {txt(
              "כל חשבון חדש מקבל 7 ימי Pro אוטומטית. ללא כרטיס אשראי.",
              "Every new account gets 7 days of Pro automatically. No credit card required."
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="glass-card rounded-2xl p-8">
            <h3 className="font-display text-2xl mb-1">Free</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {txt("התחל בלי לשלם", "Start without paying")}
            </p>
            <div className="mb-6">
              <span className="text-5xl font-display font-bold">$0</span>
              <span className="text-muted-foreground">/{txt("לתמיד", "forever")}</span>
            </div>
            <ul className="space-y-3 mb-8">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-positive mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => (user ? null : navigate("/auth"))}
              disabled={!!user}
            >
              {user ? txt("החשבון שלך", "Your plan") : txt("הירשם חינם", "Sign up free")}
            </Button>
          </div>

          {/* Pro */}
          <div className="relative glass-card rounded-2xl p-8 border-primary/40 shadow-gold overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-gold text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              {txt("הכי פופולרי", "Most popular")}
            </div>
            <h3 className="font-display text-2xl mb-1 text-gradient-gold flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Pro
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {txt("לקהילה הרצינית", "For the serious community")}
            </p>
            <div className="mb-6">
              <span className="text-5xl font-display font-bold text-gradient-gold">$5</span>
              <span className="text-muted-foreground">/{txt("חודש", "month")}</span>
              <p className="text-xs text-primary mt-1">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {txt("שבוע ראשון חינם!", "First 7 days free!")}
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-gold text-primary-foreground"
              disabled={subscription?.tier === "pro"}
            >
              {subscription?.tier === "pro"
                ? txt("אתה כבר Pro 👑", "You're Pro 👑")
                : subscription?.isPro
                ? txt(`שדרג עכשיו (נשארו ${subscription.trialDaysLeft} ימי ניסיון)`, `Upgrade now (${subscription.trialDaysLeft} trial days left)`)
                : user
                ? txt("שדרג ל-Pro", "Upgrade to Pro")
                : txt("התחל ניסיון חינם", "Start free trial")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
