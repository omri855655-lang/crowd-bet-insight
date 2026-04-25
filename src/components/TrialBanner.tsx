import { Crown, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { useState } from "react";

export const TrialBanner = () => {
  const { subscription, user } = useAuth();
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed || !subscription) return null;
  // Only show during active trial (not paid pro, not expired free)
  if (subscription.tier === "pro") return null;
  if (subscription.trialDaysLeft <= 0) return null;

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  return (
    <div className="bg-gradient-gold text-primary-foreground">
      <div className="container flex items-center justify-between gap-3 py-2 text-sm">
        <div className="flex items-center gap-2 font-semibold">
          <Crown className="w-4 h-4" />
          <span>
            {txt(
              `נותרו ${subscription.trialDaysLeft} ימים בניסיון Pro החינמי שלך`,
              `${subscription.trialDaysLeft} days left in your free Pro trial`
            )}
          </span>
          <a
            href="#pricing"
            className="underline underline-offset-2 hover:opacity-80 hidden sm:inline"
          >
            {txt("שדרג עכשיו ב-$5/חודש", "Upgrade now for $5/mo")}
          </a>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label={txt("סגור", "Dismiss")}
          className="opacity-80 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
