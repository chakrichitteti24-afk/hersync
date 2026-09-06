'use client';

import React, { useState, useMemo } from 'react';
import { Globe, Check, Search } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { SUPPORTED_LANGUAGES, LanguageMeta } from '@/i18n/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'compact' | 'pill' | 'card' | 'header';
  className?: string;
  align?: 'start' | 'end' | 'center';
}

export function LanguageSelector({
  variant = 'compact',
  className,
  align = 'end',
}: LanguageSelectorProps) {
  const { language, setLanguage, meta, t } = useTranslation();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return SUPPORTED_LANGUAGES;
    const q = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (lang) =>
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = async (lang: LanguageMeta) => {
    triggerHaptic('selection');
    await setLanguage(lang.name);
    setIsOpen(false);
  };

  // 1. Card Variant (for Settings / Profile page)
  if (variant === 'card') {
    return (
      <div className={cn('space-y-4 w-full', className)}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-background/80 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredLanguages.map((l) => {
            const isSelected = l.name === language;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => handleSelect(l)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer group',
                  isSelected
                    ? 'bg-primary/15 border-primary/40 text-foreground shadow-sm shadow-primary/10 ring-1 ring-primary/30'
                    : 'bg-card/40 border-border/40 hover:bg-card/80 hover:border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0" role="img" aria-label={l.name}>
                    {l.flag}
                  </span>
                  <div className="min-w-0 truncate">
                    <p className={cn('text-sm font-medium leading-tight truncate', isSelected && 'text-primary font-semibold')}>
                      {l.nativeName}
                    </p>
                    <p className="text-xs text-muted-foreground/70 truncate">{l.name}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Pill Variant (for desktop Sidebar)
  if (variant === 'pill') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border border-border/40 bg-card/40 hover:bg-card/80 text-muted-foreground hover:text-foreground transition-all cursor-pointer group w-full justify-between',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-primary shrink-0 transition-transform group-hover:rotate-12" />
            <span className="truncate">{meta.flag} {meta.nativeName}</span>
          </div>
          <span className="text-[10px] text-muted-foreground/70 uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 shrink-0">
            {meta.code}
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className="w-64 max-h-[380px] overflow-y-auto p-1.5 backdrop-blur-2xl bg-card/95 border-border/50 shadow-2xl rounded-2xl z-50"
        >
          <DropdownMenuLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{t('common.selectLanguage')}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border/40" />

          {SUPPORTED_LANGUAGES.map((l) => {
            const isSelected = l.name === language;
            return (
              <DropdownMenuItem
                key={l.code}
                onClick={() => handleSelect(l)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-foreground hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{l.flag}</span>
                  <span>{l.nativeName}</span>
                  <span className="text-[10px] text-muted-foreground/60">({l.name})</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 3. Header Variant (for Login / Signup / Marketing pages)
  if (variant === 'header') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-background/60 hover:bg-background backdrop-blur-lg text-foreground transition-all cursor-pointer shadow-xs hover:shadow-md',
            className
          )}
        >
          <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-sm">{meta.flag}</span>
          <span className="font-medium text-xs">{meta.nativeName}</span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className="w-56 max-h-80 overflow-y-auto p-1.5 backdrop-blur-2xl bg-card/95 border-border/50 shadow-2xl rounded-2xl z-50"
        >
          <DropdownMenuLabel className="text-[11px] font-semibold px-2 py-1 text-muted-foreground">
            {t('common.selectLanguage')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1 bg-border/40" />

          {SUPPORTED_LANGUAGES.map((l) => {
            const isSelected = l.name === language;
            return (
              <DropdownMenuItem
                key={l.code}
                onClick={() => handleSelect(l)}
                className={cn(
                  'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer',
                  isSelected
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-foreground hover:bg-white/5'
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{l.flag}</span>
                  <span>{l.nativeName}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 4. Compact Variant (Default, for Mobile Navbar)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative',
          className
        )}
        aria-label={t('common.selectLanguage')}
      >
        <Globe className="h-4.5 w-4.5" />
        <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold text-primary leading-none uppercase font-mono bg-background/90 px-0.5 rounded shadow-xs">
          {meta.code}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-56 max-h-[340px] overflow-y-auto p-1.5 backdrop-blur-2xl bg-card/95 border-border/50 shadow-2xl rounded-2xl z-50"
      >
        <DropdownMenuLabel className="text-xs font-semibold px-2 py-1 text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-primary" />
          <span>{t('common.selectLanguage')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-border/40" />

        {SUPPORTED_LANGUAGES.map((l) => {
          const isSelected = l.name === language;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => handleSelect(l)}
              className={cn(
                'flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer',
                isSelected
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-foreground hover:bg-white/5'
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">{l.flag}</span>
                <span>{l.nativeName}</span>
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
