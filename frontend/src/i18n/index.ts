import { SupportedLanguage, TranslationDictionary, SUPPORTED_LANGUAGES, LanguageMeta } from './types';
import { en } from './dictionaries/en';
import { hi } from './dictionaries/hi';
import { te } from './dictionaries/te';
import { ta } from './dictionaries/ta';
import { es } from './dictionaries/es';
import { fr } from './dictionaries/fr';
import { de } from './dictionaries/de';
import { kn } from './dictionaries/kn';
import { ml } from './dictionaries/ml';
import { mr } from './dictionaries/mr';
import { bn } from './dictionaries/bn';
import { gu } from './dictionaries/gu';
import { ar } from './dictionaries/ar';
import { pt } from './dictionaries/pt';

export * from './types';

export const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  English: en,
  Hindi: hi,
  Telugu: te,
  Tamil: ta,
  Spanish: es,
  French: fr,
  German: de,
  Kannada: kn,
  Malayalam: ml,
  Marathi: mr,
  Bengali: bn,
  Gujarati: gu,
  Arabic: ar,
  Portuguese: pt,
};

/**
 * Normalizes any language name, ISO 639-1 code, or alias to a canonical SupportedLanguage.
 */
export function normalizeLanguage(lang?: string | null): SupportedLanguage {
  if (!lang) return 'English';
  const clean = lang.trim().toLowerCase();
  const baseCode = clean.split(/[-_]/)[0];

  // English
  if (['en', 'eng', 'english'].includes(clean) || baseCode === 'en') return 'English';

  // Hindi
  if (['hi', 'hin', 'hindi', 'हिंदी', 'हिन्दी'].includes(clean) || clean.includes('devanagari') || baseCode === 'hi') return 'Hindi';

  // Telugu
  if (['te', 'tel', 'telugu', 'తెలుగు'].includes(clean) || baseCode === 'te') return 'Telugu';

  // Tamil
  if (['ta', 'tam', 'tamil', 'தமிழ்'].includes(clean) || baseCode === 'ta') return 'Tamil';

  // Spanish
  if (['es', 'spa', 'spanish', 'español', 'espanol'].includes(clean) || baseCode === 'es') return 'Spanish';

  // French
  if (['fr', 'fra', 'fre', 'french', 'français', 'francais'].includes(clean) || baseCode === 'fr') return 'French';

  // German
  if (['de', 'deu', 'ger', 'german', 'deutsch'].includes(clean) || baseCode === 'de') return 'German';

  // Kannada
  if (['kn', 'kan', 'kannada', 'ಕನ್ನಡ'].includes(clean) || baseCode === 'kn') return 'Kannada';

  // Malayalam
  if (['ml', 'mal', 'malayalam', 'മലയാളം'].includes(clean) || baseCode === 'ml') return 'Malayalam';

  // Marathi
  if (['mr', 'mar', 'marathi', 'मराठी'].includes(clean) || baseCode === 'mr') return 'Marathi';

  // Bengali
  if (['bn', 'ben', 'bengali', 'বাংলা', 'bangla'].includes(clean) || baseCode === 'bn') return 'Bengali';

  // Gujarati
  if (['gu', 'guj', 'gujarati', 'ગુજરાતી'].includes(clean) || baseCode === 'gu') return 'Gujarati';

  // Arabic
  if (['ar', 'ara', 'arabic', 'العربية', 'عربي'].includes(clean) || baseCode === 'ar') return 'Arabic';

  // Portuguese
  if (['pt', 'por', 'portuguese', 'português', 'portugues'].includes(clean) || baseCode === 'pt') return 'Portuguese';

  // Direct match lookup against canonical names
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.name.toLowerCase() === clean || l.code.toLowerCase() === clean || l.code.toLowerCase() === baseCode
  );

  return match ? match.name : 'English';
}

/**
 * Get language metadata including flags and reading direction.
 */
export function getLanguageMeta(lang?: string | null): LanguageMeta {
  const normalized = normalizeLanguage(lang);
  return (
    SUPPORTED_LANGUAGES.find((l) => l.name === normalized) ||
    SUPPORTED_LANGUAGES[0]
  );
}

/**
 * Resolves a dot-notation key (e.g., 'nav.dashboard', 'dashboard.greeting')
 * with fallback to English and parameter replacement.
 */
export function getTranslation(
  lang: string | null | undefined,
  path: string,
  params?: Record<string, string | number>
): string {
  const targetLang = normalizeLanguage(lang);
  const dict = DICTIONARIES[targetLang] || DICTIONARIES.English;
  const fallbackDict = DICTIONARIES.English;

  const getNested = (obj: any, keys: string[]): any => {
    let current = obj;
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[key];
    }
    return current;
  };

  const keys = path.split('.');
  let value = getNested(dict, keys);

  // Fallback to English if missing in chosen language
  if (value === undefined && dict !== fallbackDict) {
    value = getNested(fallbackDict, keys);
  }

  // Fallback to the raw key path if missing in English too
  if (value === undefined || typeof value !== 'string') {
    return path;
  }

  // Interpolate parameters {param}
  if (params) {
    let interpolated = value;
    for (const [pKey, pVal] of Object.entries(params)) {
      interpolated = interpolated.replace(
        new RegExp(`\\{${pKey}\\}`, 'g'),
        String(pVal)
      );
    }
    return interpolated;
  }

  return value;
}
