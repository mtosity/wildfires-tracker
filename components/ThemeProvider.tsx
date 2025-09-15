import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => {
      // Check for storage first
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme) {
        return storedTheme;
      }
      
      // Check if dark class already applied by initialization script
      if (document.documentElement.classList.contains('dark')) {
        return 'dark';
      }
      
      return defaultTheme;
    }
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Don't remove classes right away - might cause flicker
    // Only update if needed
    const hasDarkClass = root.classList.contains('dark');
    const hasLightClass = root.classList.contains('light');
    
    // First determine what class should be applied
    let classToAdd: 'dark' | 'light';
    
    if (theme === "system") {
      classToAdd = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      classToAdd = theme as 'dark' | 'light';
    }
    
    // Now update classes only if needed
    if (classToAdd === 'dark' && !hasDarkClass) {
      root.classList.remove('light');
      root.classList.add('dark');
    } else if (classToAdd === 'light' && !hasLightClass) {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  
  return context;
};