import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, language = "en" } = await req.json();

    if (!question || typeof question !== "string" || question.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Invalid question" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull recent crowd context
    const { data: recentBets } = await supabase
      .from("bets")
      .select("sport, home_team, away_team, bet_on, amount, currency, bookmaker, odds")
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: userBets } = await supabase
      .from("bets")
      .select("sport, bet_on, amount, result")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const crowdSummary = (recentBets || []).map(b =>
      `${b.sport}: ${b.bet_on} ${b.amount}${b.currency} @${b.odds || "?"} on ${b.bookmaker}`
    ).join("\n");

    const userSummary = (userBets || []).map(b =>
      `${b.sport}: ${b.bet_on} ${b.amount} (${b.result || "pending"})`
    ).join("\n") || "No betting history yet.";

    const sysPrompt = language === "he"
      ? `אתה יועץ הימורים מתוחכם. השתמש בנתונים הבאים כדי לתת המלצה. תמיד הזכר ניהול אחראי ושסטטיסטיקה אינה ערובה.\n\nהיסטוריית המשתמש:\n${userSummary}\n\nהימורי הקהילה האחרונים:\n${crowdSummary}`
      : `You are a sophisticated betting advisor. Use the data below to give a tailored pick. Always mention responsible gambling and that statistics are not a guarantee.\n\nUser history:\n${userSummary}\n\nRecent community bets:\n${crowdSummary}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: question },
        ],
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: language === "he" ? "יותר מדי בקשות, נסה שוב בעוד רגע" : "Rate limit, try again shortly" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: language === "he" ? "נגמרו הקרדיטים של AI" : "AI credits exhausted" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text();
      throw new Error(`AI error ${aiRes.status}: ${t}`);
    }

    const ai = await aiRes.json();
    const recommendation = ai.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ recommendation }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-recommend error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
