import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

type Language = "en" | "hi";

interface PreferencesContextValue {
  language: Language;
  darkMode: boolean;
  toggleLanguage: () => void;
  toggleTheme: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>("en");
  const [darkMode, setDarkMode] = useState(false);

  const value = useMemo(() => ({
    language,
    darkMode,
    toggleLanguage: () => setLanguage((current) => (current === "en" ? "hi" : "en")),
    toggleTheme: () => setDarkMode((current) => !current)
  }), [darkMode, language]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return context;
}
