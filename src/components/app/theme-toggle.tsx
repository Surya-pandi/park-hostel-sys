"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = localStorage.getItem("pcet-theme");
      const shouldUseDark =
        saved === "dark" ||
        (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", shouldUseDark);
      setIsDark(shouldUseDark);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("pcet-theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
