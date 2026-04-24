import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/i18n";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const schema = z.object({
  sport: z.string().min(1).max(40),
  league: z.string().max(80).optional(),
  home_team: z.string().min(1).max(80),
  away_team: z.string().min(1).max(80),
  bet_on: z.string().min(1).max(80),
  amount: z.coerce.number().positive().max(1_000_000),
  currency: z.enum(["USD", "EUR", "ILS", "GBP"]),
  bookmaker: z.string().min(1).max(40),
  odds: z.coerce.number().min(1).max(1000).optional(),
});

const BOOKMAKERS = ["Winner", "Bet365", "Pinnacle", "William Hill", "DraftKings", "Other"];
const SPORTS = ["Soccer", "Basketball", "American Football", "Tennis", "Baseball", "MMA", "Other"];

export const ReportBetDialog = ({ trigger }: { trigger?: React.ReactNode }) => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sport: "Soccer",
    league: "",
    home_team: "",
    away_team: "",
    bet_on: "",
    amount: "",
    currency: "USD",
    bookmaker: "Winner",
    odds: "",
  });

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  const handleOpen = (v: boolean) => {
    if (v && !user) {
      toast.info(txt("התחבר כדי לדווח על הימור", "Sign in to report a bet"));
      navigate("/auth");
      return;
    }
    setOpen(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("bets").insert({
      user_id: user.id,
      ...parsed.data,
      result: "pending",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(txt("ההימור דווח! 🎯", "Bet reported! 🎯"));
      setOpen(false);
      setForm({ ...form, home_team: "", away_team: "", bet_on: "", amount: "", odds: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-gold text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            {txt("דווח על הימור", "Report a bet")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold font-display">
            {txt("דווח על ההימור שלך", "Report your bet")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{txt("ספורט", "Sport")}</Label>
              <Select value={form.sport} onValueChange={(v) => setForm({ ...form, sport: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{txt("ליגה", "League")}</Label>
              <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} placeholder="Premier League" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{txt("קבוצת בית", "Home team")}</Label>
              <Input value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} required />
            </div>
            <div>
              <Label>{txt("קבוצת חוץ", "Away team")}</Label>
              <Input value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>{txt("הימרתי על", "I bet on")}</Label>
            <Input value={form.bet_on} onChange={(e) => setForm({ ...form, bet_on: e.target.value })} placeholder={txt("שם הקבוצה / תיקו / מעל 2.5", "Team name / Draw / Over 2.5")} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{txt("סכום", "Amount")}</Label>
              <Input type="number" min="1" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <Label>{txt("מטבע", "Currency")}</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="ILS">ILS ₪</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{txt("יחס", "Odds")}</Label>
              <Input type="number" min="1" step="0.01" value={form.odds} onChange={(e) => setForm({ ...form, odds: e.target.value })} placeholder="2.10" />
            </div>
          </div>
          <div>
            <Label>{txt("איפה הימרת", "Bookmaker")}</Label>
            <Select value={form.bookmaker} onValueChange={(v) => setForm({ ...form, bookmaker: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BOOKMAKERS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-gold text-primary-foreground">
            {loading ? "..." : txt("שלח לקהילה", "Submit to community")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {txt("הדיווח שלך מזין את חכמת ההמונים 🧠", "Your report feeds the crowd wisdom 🧠")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
