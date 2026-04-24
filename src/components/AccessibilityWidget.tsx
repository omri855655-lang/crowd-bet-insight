import { useState, useEffect } from "react";
import { Settings2, Type, Eye, ZapOff, Volume2, VolumeX, Keyboard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useA11y } from "@/contexts/AccessibilityContext";
import { useI18n } from "@/i18n/i18n";
import { cn } from "@/lib/utils";

export const AccessibilityWidget = () => {
  const { lang } = useI18n();
  const a = useA11y();
  const [open, setOpen] = useState(false);

  // Keyboard shortcut: Alt+A to toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const txt = (he: string, en: string) => (lang === "he" ? he : en);

  return (
    <>
      {/* Trigger button — always on the LEFT */}
      <button
        onClick={() => setOpen(true)}
        aria-label={txt("פתח תפריט נגישות", "Open accessibility menu")}
        className="fixed left-4 bottom-4 z-[60] w-14 h-14 rounded-full bg-gradient-gold text-primary-foreground shadow-gold flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Settings2 className="w-6 h-6" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/50"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-80 max-w-[90vw] bg-card border-r border-border p-6 overflow-y-auto shadow-elevated",
              "animate-in slide-in-from-left duration-200"
            )}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-gradient-gold">
                {txt("נגישות", "Accessibility")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                aria-label={txt("סגור", "Close")}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Font size */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4" />
                  {txt("גודל טקסט", "Text size")}: {Math.round(a.fontScale * 100)}%
                </Label>
                <Slider
                  value={[a.fontScale]}
                  min={0.85}
                  max={1.5}
                  step={0.05}
                  onValueChange={([v]) => a.set("fontScale", v)}
                />
              </div>

              {/* High contrast */}
              <div className="flex items-center justify-between">
                <Label htmlFor="hc" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {txt("ניגודיות גבוהה", "High contrast")}
                </Label>
                <Switch id="hc" checked={a.highContrast} onCheckedChange={(v) => a.set("highContrast", v)} />
              </div>

              {/* Reduced motion */}
              <div className="flex items-center justify-between">
                <Label htmlFor="rm" className="flex items-center gap-2">
                  <ZapOff className="w-4 h-4" />
                  {txt("בטל אנימציות", "Reduce motion")}
                </Label>
                <Switch id="rm" checked={a.reducedMotion} onCheckedChange={(v) => a.set("reducedMotion", v)} />
              </div>

              {/* Underline links */}
              <div className="flex items-center justify-between">
                <Label htmlFor="ul" className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" />
                  {txt("הדגש קישורים", "Underline links")}
                </Label>
                <Switch id="ul" checked={a.underlineLinks} onCheckedChange={(v) => a.set("underlineLinks", v)} />
              </div>

              {/* TTS */}
              <div className="flex items-center justify-between">
                <Label htmlFor="tts" className="flex items-center gap-2">
                  {a.ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  {txt("הקראה קולית", "Text-to-speech")}
                </Label>
                <Switch
                  id="tts"
                  checked={a.ttsEnabled}
                  onCheckedChange={(v) => {
                    a.set("ttsEnabled", v);
                    if (!v) a.stopSpeaking();
                  }}
                />
              </div>
              {a.ttsEnabled && (
                <p className="text-xs text-muted-foreground -mt-3">
                  {txt("בחר טקסט באתר ולחץ עליו פעמיים כדי להקריא", "Click any text twice to read it aloud")}
                </p>
              )}

              {/* Colorblind */}
              <div>
                <Label className="mb-2 block">{txt("מצב עיוורון צבעים", "Colorblind mode")}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["none", "protanopia", "deuteranopia", "tritanopia"] as const).map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={a.colorblindMode === m ? "default" : "outline"}
                      onClick={() => a.set("colorblindMode", m)}
                      className="text-xs"
                    >
                      {m === "none" ? txt("ללא", "None") : m}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Button onClick={a.reset} variant="outline" className="w-full" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {txt("איפוס", "Reset")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {txt("קיצור: Alt+A", "Shortcut: Alt+A")}
                </p>
              </div>
            </div>
          </div>

          {/* SVG filters for colorblind modes */}
          <svg className="absolute" style={{ width: 0, height: 0 }}>
            <defs>
              <filter id="cb-protanopia">
                <feColorMatrix values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
              </filter>
              <filter id="cb-deuteranopia">
                <feColorMatrix values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
              </filter>
              <filter id="cb-tritanopia">
                <feColorMatrix values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0" />
              </filter>
            </defs>
          </svg>
        </div>
      )}
    </>
  );
};
