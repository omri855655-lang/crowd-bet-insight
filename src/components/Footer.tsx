import { useI18n } from "@/i18n/i18n";

export const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <span className="font-display font-black text-primary-foreground">O</span>
            </div>
            <div>
              <div className="font-display font-bold text-gradient-gold">OddsOracle</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("footer.copy")}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">{t("footer.about")}</a>
            <a href="#" className="hover:text-foreground transition-colors">API</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("footer.responsible")}</a>
            <a href="#" className="hover:text-foreground transition-colors">{t("footer.terms")}</a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/30 text-center text-[11px] text-muted-foreground/70 leading-relaxed max-w-2xl mx-auto">
          {t("footer.disclaimer")}
        </div>
      </div>
    </footer>
  );
};
