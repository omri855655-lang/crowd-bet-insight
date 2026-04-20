import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from "recharts";
import { volumeTrend, games } from "@/data/mockData";

export const CrowdWisdom = () => {
  // Aggregate crowd money across all games
  const crowdData = games.slice(0, 5).map((g) => ({
    name: `${g.homeTeam.slice(0, 3)} vs ${g.awayTeam.slice(0, 3)}`,
    home: g.crowdMoney.home,
    away: g.crowdMoney.away,
  }));

  return (
    <section className="container py-16 md:py-24">
      <div className="text-center mb-14">
        <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Crowd Wisdom</div>
        <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight max-w-3xl mx-auto">
          The collective is <span className="italic text-gradient-gold">smarter</span> than any single bookie.
        </h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Volume trend - 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8 shadow-card-premium"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold mb-1">24h global volume</h3>
              <p className="text-sm text-muted-foreground">Aggregated across all bookmakers + user reports</p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold text-gradient-gold tabular">$144.7M</div>
              <div className="text-xs text-positive font-semibold tabular">+12.4% vs yesterday</div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeTrend}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(42 65% 60%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(42 65% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => [`$${v}M`, "Volume"]}
                />
                <Area type="monotone" dataKey="volume" stroke="hsl(42 65% 60%)" strokeWidth={2.5} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top sport split */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card rounded-2xl p-6 md:p-8 shadow-card-premium"
        >
          <h3 className="font-display text-xl font-semibold mb-1">Sport split</h3>
          <p className="text-sm text-muted-foreground mb-6">By 24h volume</p>

          <div className="space-y-4">
            {[
              { sport: "Football", pct: 48, vol: "$69.5M" },
              { sport: "Basketball", pct: 22, vol: "$31.8M" },
              { sport: "NFL", pct: 18, vol: "$26.0M" },
              { sport: "Tennis", pct: 8, vol: "$11.6M" },
              { sport: "Other", pct: 4, vol: "$5.8M" },
            ].map((row) => (
              <div key={row.sport}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium">{row.sport}</span>
                  <span className="text-muted-foreground tabular">{row.vol} · {row.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${row.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-gold"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Crowd money per game */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3 glass-card rounded-2xl p-6 md:p-8 shadow-card-premium"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="font-display text-xl font-semibold mb-1">Money flow per matchup</h3>
              <p className="text-sm text-muted-foreground">Where the crowd is actually putting their money (in $K)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-positive" /> Home</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Away</div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={crowdData} barGap={4}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}K`} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--secondary) / 0.3)" }}
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(v: number) => `$${v}K`}
                />
                <Bar dataKey="home" radius={[6, 6, 0, 0]}>
                  {crowdData.map((_, i) => (
                    <Cell key={i} fill="hsl(142 70% 45%)" />
                  ))}
                </Bar>
                <Bar dataKey="away" radius={[6, 6, 0, 0]}>
                  {crowdData.map((_, i) => (
                    <Cell key={i} fill="hsl(42 65% 60%)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
