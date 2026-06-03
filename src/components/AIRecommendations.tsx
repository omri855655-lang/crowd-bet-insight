import { useState } from "react";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const AIRecommendations = () => {
  const { user, subscription } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const txt = (he: string, en: string) => (lang === "he" ? he : en);
  const isPro = subscription?.isPro;

  const generate = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isPro) {
      toast.error(txt("נדרש מנוי Pro או ניסיון פעיל", "Pro subscription or active trial required"));
      return;
    }
    if (!prompt.trim()) {
      toast.error(txt("הכנס שאלה", "Enter a question"));
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error(txt("פיצ'ר ה-AI עדיין לא מחובר בפרסום הזה", "The AI feature is not connected in this deployment yet"));
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommend", {
        body: { question: prompt, language: lang },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data?.recommendation || "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "AI error";
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border" id="ai">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-sm uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" />
            {txt("יועץ AI", "AI Advisor")}
          </div>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight">
            {txt("המלצות חכמות,", "Smart picks,")}{" "}
            <span className="text-gradient-gold">{txt("מבוססות נתונים", "data-driven")}</span>
          </h2>
          <p className="text-muted-foreground mt-3">
            {txt(
              "ה-AI מנתח את ההיסטוריה שלך + מה שהקהילה מהמרת + יחסים חיים, ונותן המלצה מותאמת.",
              "Our AI analyses your history + community bets + live odds, and gives a tailored pick."
            )}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 shadow-elevated">
          {!isPro && (
            <div className="mb-4 p-4 bg-gradient-to-r from-primary/10 to-transparent border border-primary/30 rounded-lg flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">
                  {txt("פיצ'ר Pro", "Pro feature")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user
                    ? txt("שדרג ל-Pro $5/חודש", "Upgrade to Pro for $5/month")
                    : txt("הירשם וקבל 7 ימי Pro חינם", "Sign up and get 7 days of Pro free")}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(user ? "/" : "/auth")}
                className="bg-gradient-gold text-primary-foreground"
              >
                {user ? txt("שדרג", "Upgrade") : txt("הירשם", "Sign up")}
              </Button>
            </div>
          )}

          <Textarea
            placeholder={txt(
              "לדוגמה: על מה כדאי להמר במשחק ריאל מדריד מול ברצלונה? מה הקהילה חושבת?",
              "e.g., What should I bet on Real Madrid vs Barcelona? What does the crowd think?"
            )}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!isPro || loading}
            rows={3}
            className="mb-3"
          />
          <Button
            onClick={generate}
            disabled={loading || !isPro}
            className="w-full bg-gradient-gold text-primary-foreground"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {txt("מנתח...", "Analyzing...")}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> {txt("קבל המלצה", "Get pick")}</>
            )}
          </Button>

          {result && (
            <div className="mt-6 p-5 bg-card rounded-xl border border-primary/20">
              <h3 className="font-display text-lg text-gradient-gold mb-2">
                {txt("ההמלצה שלנו", "Our recommendation")}
              </h3>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{result}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
