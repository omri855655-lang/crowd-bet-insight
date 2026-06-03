import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type SubscriptionInfo = {
  tier: "free" | "pro";
  trial_ends_at: string | null;
  isPro: boolean; // tier === 'pro' OR trial active
  trialDaysLeft: number;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionInfo | null;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const loadSubscription = async (uid: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("tier, trial_ends_at")
      .eq("user_id", uid)
      .maybeSingle();
    if (!data) {
      setSubscription(null);
      return;
    }
    const trialEnds = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    const trialActive = trialEnds ? trialEnds.getTime() > Date.now() : false;
    const trialDaysLeft = trialEnds
      ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000))
      : 0;
    setSubscription({
      tier: data.tier as "free" | "pro",
      trial_ends_at: data.trial_ends_at,
      isPro: data.tier === "pro" || trialActive,
      trialDaysLeft,
    });
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setSubscription(null);
      return;
    }

    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadSubscription(sess.user.id), 0);
      } else {
        setSubscription(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadSubscription(sess.user.id);
      setLoading(false);
    });

    return () => sub.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSubscription = async () => {
    if (user) await loadSubscription(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, subscription, signOut, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
