export type SupportedLanguage =
  | 'English'
  | 'Hindi'
  | 'Telugu'
  | 'Tamil'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi'
  | 'Bengali'
  | 'Gujarati'
  | 'Arabic'
  | 'Portuguese';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'te'
  | 'ta'
  | 'es'
  | 'fr'
  | 'de'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'ar'
  | 'pt';

export interface LanguageMeta {
  code: LanguageCode;
  name: SupportedLanguage;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', dir: 'ltr' },
];

export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = SUPPORTED_LANGUAGES.map((l) => l.code);

export interface TranslationDictionary {
  nav: {
    dashboard: string;
    checkin: string;
    cycle: string;
    skin: string;
    wellness: string;
    rewards: string;
    store: string;
    reports: string;
    profile: string;
    disclaimer: string;
    today: string;
    plan: string;
    you: string;
    privacyMode: string;
  };
  common: {
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    confirm: string;
    next: string;
    previous: string;
    close: string;
    loading: string;
    retry: string;
    error: string;
    success: string;
    done: string;
    day: string;
    days: string;
    streak: string;
    coins: string;
    today: string;
    yesterday: string;
    viewAll: string;
    search: string;
    selectLanguage: string;
    language: string;
    signOut: string;
    active: string;
    status: string;
  };
  dashboard: {
    goodMorning: string;
    goodAfternoon: string;
    goodEvening: string;
    summarySubtitle: string;
    dailyStreak: string;
    dayStreak: string;
    streakMotivation: string;
    completeCheckin: string;
    allSlotsComplete: string;
    checkinProgress: string;
    cycleStatus: string;
    dayOfCycle: string;
    nextPeriodIn: string;
    logPeriod: string;
    wellnessTasks: string;
    completed: string;
    pending: string;
    refreshProtocol: string;
    foodSolverTitle: string;
    foodSolverSubtitle: string;
    companionCardTitle: string;
    companionCardSubtitle: string;
    askLuna: string;
    notificationPromptTitle: string;
    notificationPromptDesc: string;
    enableNotifications: string;
  };
  checkin: {
    title: string;
    subtitle: string;
    morningSlot: string;
    afternoonSlot: string;
    eveningSlot: string;
    nightSlot: string;
    howAreYouFeeling: string;
    energyLevel: string;
    sleepHours: string;
    waterIntake: string;
    symptomsLogged: string;
    noSymptoms: string;
    notes: string;
    saveDailyLog: string;
    logSavedSuccess: string;
  };
  cycle: {
    title: string;
    subtitle: string;
    currentPhase: string;
    menstrualPhase: string;
    follicularPhase: string;
    ovulationPhase: string;
    lutealPhase: string;
    fertileWindow: string;
    logFlow: string;
    flowLight: string;
    flowMedium: string;
    flowHeavy: string;
    flowSpotting: string;
    cycleHistory: string;
    averageLength: string;
    nextCyclePrediction: string;
  };
  wellness: {
    title: string;
    subtitle: string;
    nutrition: string;
    movement: string;
    mind: string;
    supplements: string;
    completedTasks: string;
    regeneratePlan: string;
    streakBonus: string;
  };
  skin: {
    title: string;
    subtitle: string;
    morningRoutine: string;
    eveningRoutine: string;
    trackBreakouts: string;
    hairHealth: string;
    recommendations: string;
  };
  reports: {
    title: string;
    subtitle: string;
    healthScore: string;
    cycleRegularity: string;
    symptomTrends: string;
    exportPdf: string;
    downloadReport: string;
  };
  rewards: {
    title: string;
    subtitle: string;
    coinBalance: string;
    dailySpin: string;
    spinNow: string;
    achievements: string;
    referFriends: string;
  };
  store: {
    title: string;
    subtitle: string;
    themes: string;
    avatars: string;
    soundscapes: string;
    badges: string;
    redeem: string;
    equipped: string;
  };
  profile: {
    title: string;
    subtitle: string;
    personalInfo: string;
    fullName: string;
    dob: string;
    wellnessMode: string;
    modePcos: string;
    modePregnancy: string;
    modeGeneral: string;
    appLanguage: string;
    companionPersonality: string;
    themeAppearance: string;
    notifications: string;
    saveChanges: string;
    signOut: string;
  };
  auth: {
    welcomeBack: string;
    signInSubtitle: string;
    createAccount: string;
    signUpSubtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    signIn: string;
    signUp: string;
    noAccount: string;
    hasAccount: string;
    resetPasswordTitle: string;
    sendResetLink: string;
    backToSignIn: string;
  };
  companion: {
    chatTitle: string;
    chatSubtitle: string;
    inputPlaceholder: string;
    send: string;
    voiceInput: string;
    suggestedTopics: string;
  };
}
