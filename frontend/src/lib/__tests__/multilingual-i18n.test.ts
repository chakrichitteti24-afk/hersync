import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_LANGUAGE_CODES,
  normalizeLanguage,
  getLanguageMeta,
  getTranslation,
  DICTIONARIES,
} from '@/i18n';
import type { LanguageCode } from '@/i18n/types';

describe('Multilingual i18n Core System', () => {
  describe('Supported Languages & Metadata', () => {
    it('supports 14 distinct languages', () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(14);
      expect(SUPPORTED_LANGUAGE_CODES).toHaveLength(14);
    });

    it('contains all required languages with flags and native names', () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      const expected: LanguageCode[] = [
        'en', 'hi', 'te', 'ta', 'es', 'fr', 'de', 'kn', 'ml', 'mr', 'bn', 'gu', 'ar', 'pt',
      ];
      expected.forEach((exp) => {
        expect(codes).toContain(exp);
      });
    });

    it('correctly tags Arabic as RTL and all others as LTR', () => {
      const arMeta = getLanguageMeta('ar');
      expect(arMeta.dir).toBe('rtl');

      const nonRtl: LanguageCode[] = ['en', 'hi', 'te', 'ta', 'es', 'fr', 'de', 'kn', 'ml', 'mr', 'bn', 'gu', 'pt'];
      nonRtl.forEach((code) => {
        expect(getLanguageMeta(code).dir).toBe('ltr');
      });
    });
  });

  describe('Language Code Normalization', () => {
    it('normalizes exact matches', () => {
      expect(normalizeLanguage('hi')).toBe('Hindi');
      expect(normalizeLanguage('te')).toBe('Telugu');
      expect(normalizeLanguage('ta')).toBe('Tamil');
      expect(normalizeLanguage('ar')).toBe('Arabic');
    });

    it('normalizes case-insensitive codes and locales like en-US, hi-IN, fr-FR', () => {
      expect(normalizeLanguage('en-US')).toBe('English');
      expect(normalizeLanguage('HI-in')).toBe('Hindi');
      expect(normalizeLanguage('te-IN')).toBe('Telugu');
      expect(normalizeLanguage('FR-FR')).toBe('French');
      expect(normalizeLanguage('es-ES')).toBe('Spanish');
      expect(normalizeLanguage('pt-BR')).toBe('Portuguese');
    });

    it('falls back to "English" for unsupported or nullish inputs', () => {
      expect(normalizeLanguage('')).toBe('English');
      expect(normalizeLanguage(null)).toBe('English');
      expect(normalizeLanguage(undefined)).toBe('English');
      expect(normalizeLanguage('xx-ZZ')).toBe('English');
      expect(normalizeLanguage('klingon')).toBe('English');
    });
  });

  describe('Translation Lookup and Fallbacks', () => {
    it('returns exact translation when available in target language', () => {
      const enTitle = getTranslation('en', 'nav.dashboard');
      expect(enTitle).toBe('Dashboard');

      const hiTitle = getTranslation('hi', 'nav.dashboard');
      expect(hiTitle).toBe('डैशबोर्ड');

      const teTitle = getTranslation('te', 'nav.dashboard');
      expect(teTitle).toBe('డాష్‌బోర్డ్');

      const arTitle = getTranslation('ar', 'nav.dashboard');
      expect(arTitle).toBe('لوحة التحكم');
    });

    it('falls back to English when a key does not exist in target dictionary', () => {
      const fallbackVal = getTranslation('hi', 'nonexistent.fakeKey' as any);
      expect(fallbackVal).toBe('nonexistent.fakeKey');
    });

    it('interpolates parameters correctly', () => {
      const enInterpolated = getTranslation('en', 'dashboard.dayOfCycle', { day: 14 });
      expect(enInterpolated).toBe('Day 14 of cycle');

      const hiInterpolated = getTranslation('hi', 'dashboard.dayOfCycle', { day: 14 });
      expect(hiInterpolated).toContain('14');

      const teInterpolated = getTranslation('te', 'dashboard.dayOfCycle', { day: 14 });
      expect(teInterpolated).toContain('14');
    });
  });

  describe('Dictionary Integrity across all 14 Languages', () => {
    const coreSections = [
      'nav',
      'common',
      'dashboard',
      'checkin',
      'cycle',
      'wellness',
      'skin',
      'reports',
      'rewards',
      'store',
      'profile',
      'auth',
      'companion',
    ];

    SUPPORTED_LANGUAGES.forEach(({ code, name }) => {
      it(`dictionary for ${name} (${code}) has all core top-level sections`, () => {
        const dict = DICTIONARIES[name];
        expect(dict, `Dictionary for ${name} must exist`).toBeDefined();
        coreSections.forEach((section) => {
          expect(dict[section as keyof typeof dict], `Section ${section} missing in ${name}`).toBeDefined();
        });
      });

      it(`dictionary for ${name} (${code}) has navigation keys translated`, () => {
        const dict = DICTIONARIES[name];
        expect(dict.nav.dashboard).toBeTruthy();
        expect(dict.nav.checkin).toBeTruthy();
        expect(dict.nav.cycle).toBeTruthy();
        expect(dict.nav.profile).toBeTruthy();
      });

      it(`dictionary for ${name} (${code}) has auth keys translated`, () => {
        const dict = DICTIONARIES[name];
        expect(dict.auth.signIn).toBeTruthy();
        expect(dict.auth.signUp).toBeTruthy();
        expect(dict.auth.email).toBeTruthy();
        expect(dict.auth.password).toBeTruthy();
      });
    });
  });
});
