import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type A11ySettings = {
  fontScale: number; // 0.85 - 1.5
  highContrast: boolean;
  reducedMotion: boolean;
  colorblindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  underlineLinks: boolean;
  ttsEnabled: boolean;
};

type Ctx = A11ySettings & {
  set: <K extends keyof A11ySettings>(k: K, v: A11ySettings[K]) => void;
  reset: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
};

const defaults: A11ySettings = {
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  colorblindMode: "none",
  underlineLinks: false,
  ttsEnabled: false,
};

const AccessibilityContext = createContext<Ctx | null>(null);

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<A11ySettings>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const stored = localStorage.getItem("a11y");
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    localStorage.setItem("a11y", JSON.stringify(settings));
    const root = document.documentElement;
    root.style.fontSize = `${settings.fontScale * 16}px`;
    root.classList.toggle("a11y-high-contrast", settings.highContrast);
    root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);
    root.classList.toggle("a11y-underline-links", settings.underlineLinks);
    root.setAttribute("data-colorblind", settings.colorblindMode);
  }, [settings]);

  const set = <K extends keyof A11ySettings>(k: K, v: A11ySettings[K]) =>
    setSettings((s) => ({ ...s, [k]: v }));

  const reset = () => setSettings(defaults);

  const speak = (text: string) => {
    if (!settings.ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = document.documentElement.lang === "he" ? "he-IL" : "en-US";
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <AccessibilityContext.Provider value={{ ...settings, set, reset, speak, stopSpeaking }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useA11y = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useA11y must be used within AccessibilityProvider");
  return ctx;
};
