import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  variant?: "default" | "compact";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = "default",
  className = "",
}) => {
  const { isDark, toggleTheme } = useTheme();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
          isDark
            ? "text-amber-300 hover:text-amber-200 hover:bg-slate-800"
            : "text-amber-600 hover:text-amber-700 hover:bg-slate-200"
        } ${className}`}
        title={isDark ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
        aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer select-none ${
        isDark
          ? "bg-slate-900/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 shadow-sm"
          : "bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border-slate-200 hover:border-slate-300 shadow-sm"
      } ${className}`}
      title={isDark ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
      aria-label={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
    >
      <div
        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
          isDark
            ? "bg-amber-400/10 text-amber-300 group-hover:bg-amber-400/20"
            : "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20"
        }`}
      >
        {isDark ? (
          <Sun className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      <span className="hidden sm:inline">
        {isDark ? "Mode Terang" : "Mode Gelap"}
      </span>
    </button>
  );
};
