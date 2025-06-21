
"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { name: "Default", value: "default" },
  { name: "Ocean Blue", value: "ocean-blue" },
  { name: "Forest Calm", value: "forest-calm" },
];

const LOCAL_STORAGE_KEY = "nihongo-daily-theme";

export function ThemeSwitcher() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTheme, setActiveTheme] = React.useState("forest-calm");

  React.useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedTheme && THEMES.some(t => t.value === storedTheme)) {
      setActiveTheme(storedTheme);
      if (storedTheme === "default") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", storedTheme);
      }
    }
  }, []);

  const handleThemeChange = (themeValue: string) => {
    setActiveTheme(themeValue);
    localStorage.setItem(LOCAL_STORAGE_KEY, themeValue);
    if (themeValue === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", themeValue);
    }
  };

  if (!mounted) {
    // To prevent hydration mismatch, render a placeholder or nothing until mounted
    return <div className="h-10 w-10" />; // Placeholder with same size as button
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Change theme">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.value}
            onClick={() => handleThemeChange(theme.value)}
            className="cursor-pointer"
          >
            {activeTheme === theme.value && <Check className="mr-2 h-4 w-4" />}
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
