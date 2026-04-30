import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // ✅ Load saved theme safely (client only)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    setMounted(true);
  }, []);

  // ✅ Apply theme + listen for system changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const getSystemTheme = (): "light" | "dark" =>
      mediaQuery.matches ? "dark" : "light";

    const applyTheme = () => {
      const activeTheme =
        theme === "system" ? getSystemTheme() : theme;

      setResolvedTheme(activeTheme);

      root.classList.toggle("dark", activeTheme === "dark");
    };

    applyTheme();

    // Save preference
    localStorage.setItem("theme", theme);

    // Listen ONLY when using system
    if (theme === "system") {
      const listener = () => applyTheme();
      mediaQuery.addEventListener("change", listener);

      return () => {
        mediaQuery.removeEventListener("change", listener);
      };
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ✅ Safer hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
