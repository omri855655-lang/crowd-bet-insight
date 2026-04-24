import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useI18n } from "@/i18n/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  displayName: z.string().trim().min(2).max(50).optional(),
});

const Auth = () => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: displayName, preferred_language: lang },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(lang === "he" ? "נרשמת! קיבלת 7 ימי Pro חינם 🎉" : "Signed up! You got 7 days of Pro free 🎉");
      navigate("/");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.pick({ email: true, password: true }).safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-midnight">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-primary flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === "he" ? "חזרה" : "Back"}
        </button>

        <div className="glass-card rounded-2xl p-8 shadow-elevated">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-display text-2xl text-gradient-gold">OddsOracle</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "he"
                ? "הצטרף לקהילה. 7 ימי Pro חינם."
                : "Join the community. 7 days of Pro, free."}
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{lang === "he" ? "התחברות" : "Sign in"}</TabsTrigger>
              <TabsTrigger value="signup">{lang === "he" ? "הרשמה" : "Sign up"}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="si-email">{lang === "he" ? "אימייל" : "Email"}</Label>
                  <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="si-pass">{lang === "he" ? "סיסמה" : "Password"}</Label>
                  <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
                  {loading ? "..." : (lang === "he" ? "התחבר" : "Sign in")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="su-name">{lang === "he" ? "שם תצוגה" : "Display name"}</Label>
                  <Input id="su-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="su-email">{lang === "he" ? "אימייל" : "Email"}</Label>
                  <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="su-pass">{lang === "he" ? "סיסמה (6+ תווים)" : "Password (6+ chars)"}</Label>
                  <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
                  {loading ? "..." : (lang === "he" ? "צור חשבון + 7 ימי Pro" : "Create account + 7 days Pro")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
