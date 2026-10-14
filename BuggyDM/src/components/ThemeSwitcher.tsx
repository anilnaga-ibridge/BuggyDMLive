"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon, Laptop } from "lucide-react";

type Theme = "light" | "dark" | "system";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const candidate = localStorage.getItem("theme");
      const savedTheme: Theme = candidate === "light" || candidate === "dark" ? candidate : "system";
      setTheme(savedTheme);
      setMounted(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const root = document.documentElement;
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", newTheme);
    }
  };

  // Listen to system preference changes if theme is set to 'system'
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const isDark = mediaQuery.matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  if (!mounted) {
    return <div className="h-9 w-full bg-slate-900/40 rounded-xl animate-pulse" />;
  }

  return (
    <div className="flex items-center justify-between p-1 bg-slate-900/60 border border-slate-800/80 rounded-xl w-full">
      <button
        onClick={() => changeTheme("light")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
          theme === "light"
            ? "bg-amber-500/10 text-amber-500"
            : "text-slate-500 hover:text-slate-355"
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
        <span>Light</span>
      </button>

      <button
        onClick={() => changeTheme("dark")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
          theme === "dark"
            ? "bg-emerald-500/10 text-emerald-450"
            : "text-slate-500 hover:text-slate-355"
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
        <span>Dark</span>
      </button>

      <button
        onClick={() => changeTheme("system")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
          theme === "system"
            ? "bg-violet-500/10 text-violet-400"
            : "text-slate-500 hover:text-slate-355"
        }`}
        title="System Preference"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span>System</span>
      </button>
    </div>
  );
}
