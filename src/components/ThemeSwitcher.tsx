import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import type { ThemeMode } from '../types/clinic';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'labeled';
}

export function ThemeSwitcher({ variant = 'compact' }: ThemeSwitcherProps) {
  const { language, themeMode, setThemeMode } = useClinic();
  const isHi = language === 'hi';

  const options: Array<{
    mode: ThemeMode;
    labelEn: string;
    labelHi: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { mode: 'light', labelEn: 'Light', labelHi: 'लाइट', icon: Sun },
    { mode: 'system', labelEn: 'System', labelHi: 'सिस्टम', icon: Monitor },
    { mode: 'dark', labelEn: 'Dark', labelHi: 'डार्क', icon: Moon },
  ];

  if (variant === 'labeled') {
    return (
      <div
        role="group"
        aria-label={isHi ? 'थीम चुनें (लाइट, सिस्टम, डार्क)' : 'Select color theme (Light, System, Dark)'}
        className="inline-flex items-center p-1 rounded-xl bg-white/8 border border-white/15 gap-1"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = themeMode === opt.mode;
          const label = isHi ? opt.labelHi : opt.labelEn;
          return (
            <button
              key={opt.mode}
              type="button"
              onClick={() => setThemeMode(opt.mode)}
              aria-pressed={active}
              className={`min-h-[40px] sm:min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#1C7ED6] text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={isHi ? 'थीम बदलें' : 'Color theme'}
      className="inline-flex items-center p-0.5 rounded-full bg-white/8 border border-white/15"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = themeMode === opt.mode;
        const label = isHi ? opt.labelHi : opt.labelEn;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setThemeMode(opt.mode)}
            aria-pressed={active}
            aria-label={isHi ? `${label} थीम` : `${label} theme`}
            title={isHi ? `${label} थीम` : `${label} theme`}
            className={`w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              active
                ? 'bg-[#1C7ED6] text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
