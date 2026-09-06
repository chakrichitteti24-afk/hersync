/**
 * Wellness Companion Guardrails & Tone Enforcement
 *
 * Ensures HerSync / Svanexa AI companion:
 * 1. Maintains utmost politeness, courtesy, and emotional warmth across all supported languages.
 * 2. Strictly enforces a Women's Health & Wellness domain boundary (No-Code Policy).
 * 3. Prevents programming code blocks and scripts from ever leaking to the user.
 */

export interface GuardrailCheckResult {
  isClean: boolean;
  content: string;
  intercepted: boolean;
  reason?: string;
}

/**
 * Normalized polite refusal and warm health redirect messages across all 14 supported languages.
 */
export const POLITE_NO_CODE_REFUSALS: Record<string, string> = {
  English:
    "I would be delighted to assist you, but as your personal health and wellness companion, my purpose is exclusively dedicated to supporting your well-being, menstrual cycle health, PCOS journey, and lifestyle habits. I am unable to write, explain, or debug programming code. 🌸\n\nHow are you feeling today, or is there a wellness goal, symptom, or healthy habit you would like to explore together?",

  Hindi:
    "मैं आपकी सहायता करने में अत्यंत प्रसन्न होऊंगी, परंतु आपके समर्पित स्वास्थ्य और कल्याण साथी के रूप में, मेरा पूरा ध्यान आपके स्वास्थ्य, मासिक चक्र, पीसीओएस और जीवनशैली की देखभाल पर है। मैं सॉफ़्टवेयर कोड लिखने या प्रोग्रामिंग में सहायता करने में असमर्थ हूँ। 🌸\n\nकृपया बताइए कि आज आप कैसा महसूस कर रही हैं? क्या हम आपके स्वास्थ्य, पोषण या किसी दैनिक आदत के बारे में बात कर सकते हैं?",

  Telugu:
    "మీకు సహాయం చేయడానికి నేను ఎల్లప్పుడూ సంతోషిస్తాను, కానీ మీ వ్యక్తిగత ఆరోగ్య మరియు వెల్‌నెస్ సహచరిగా, నా దృష్టి కేవలం మీ ఆరోగ్యం, పీరియడ్స్ సైకిల్, పిసిఒఎస్ మరియు జీవనశైలి సంరక్షణపై మాత్రమే ఉంటుంది. నేను కంప్యూటర్ కోడింగ్ లేదా సాఫ్ట్‌వేర్ ప్రోగ్రామింగ్ రాయలేను. 🌸\n\nదయచేసి చెప్పండి, ఈ రోజు మీ ఆరోగ్యం ఎలా ఉంది? మీ శ్రేయస్సు లేదా ఆరోగ్య లక్ష్యాల గురించి మనం మాట్లాడుకుందామా?",

  Tamil:
    "உங்களுக்கு உதவ நான் மிகவும் மகிழ்ச்சியடைகிறேன், ஆனால் உங்கள் தனிப்பட்ட நல்வாழ்வு மற்றும் ஆரோக்கியத் தோழியாக, என் முழு கவனமும் உங்கள் உடல்நலம், மாதவிடாய் சுழற்சி, பிசிஓஎஸ் மற்றும் வாழ்க்கை முறை மீதே உள்ளது. என்னால் கணினி நிரலாக்கக் குறியீடுகளை (programming code) உருவாக்க முடியாது. 🌸\n\nஇன்று உங்கள் உடல்நலம் எப்படி இருக்கிறது என்று கூறுங்கள். உங்கள் நல்வாழ்வு அல்லது ஆரோக்கியப் பழக்கங்கள் பற்றி நாம் பேசலாமா?",

  Spanish:
    "Sería un verdadero placer ayudarte, pero como tu compañera de salud y bienestar, mi dedicación es exclusiva hacia tu bienestar físico, ciclo menstrual, manejo de PCOS y estilo de vida saludable. No genero ni depuro código de programación ni scripts técnicos. 🌸\n\n¿Cómo te sientes hoy? ¿Hay algún síntoma, hábito o consulta de salud que te gustaría que revisemos con cariño?",

  French:
    "C'est un plaisir de vous accompagner, mais en tant que confidente et compagne dédiée à votre santé et bien-être, ma mission est entièrement consacrée à votre équilibre hormonal, votre cycle et votre mode de vie. Je ne peux pas concevoir ou analyser de code de programmation. 🌸\n\nComment vous sentez-vous aujourd'hui ? Souhaitez-vous échanger sur votre énergie, votre sommeil ou vos habitudes de santé ?",

  German:
    "Ich helfe dir von Herzen gerne, doch als deine persönliche Gesundheits- und Wellness-Begleiterin widme ich mich ganzheitlich deinem Wohlbefinden, deinem Zyklus, PCOS und einer gesunden Lebensweise. Ich erstelle und bearbeite keinen Programmiercode oder technische Skripte. 🌸\n\nWie fühlst du dich heute? Lass uns gerne über deine Gesundheit, deine Routinen oder deine heutigen Ziele sprechen!",

  Kannada:
    "ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನನಗೆ ಸಂತೋಷವಾಗುತ್ತದೆ, ಆದರೆ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮದ ಒಡನಾಡಿಯಾಗಿ, ನನ್ನ ಗಮನವು ನಿಮ್ಮ ಆರೋಗ್ಯ, ಮುಟ್ಟಿನ ಚಕ್ರ, ಪಿಸಿಓಎಸ್ ಮತ್ತು ಆರೋಗ್ಯಕರ ಜೀವನಶೈಲಿಗೆ ಮಾತ್ರ ಮೀಸಲಾಗಿದೆ. ನಾನು ಕಂಪ್ಯೂಟರ್ ಕೋಡಿಂಗ್ ಅಥವಾ ಪ್ರೋಗ್ರಾಮಿಂಗ್ ಬರೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ. 🌸\n\nದಯವಿಟ್ಟು ತಿಳಿಸಿ, ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ? ನಿಮ್ಮ ಯೋಗಕ್ಷೇಮ ಅಥವಾ ಆರೋಗ್ಯಕರ ಅಭ್ಯಾಸಗಳ ಬಗ್ಗೆ ನಾವು ಮಾತನಾಡೋಣವೇ?",

  Malayalam:
    "നിങ്ങളെ സഹായിക്കുന്നതിൽ എനിക്ക് വലിയ സന്തോഷമുണ്ട്, എന്നാൽ നിങ്ങളുടെ വ്യക്തിഗത ആരോഗ്യ-ക്ഷേമ കൂട്ടുകാരി എന്ന നിലയിൽ എന്റെ ശ്രദ്ധ പൂർണ്ണമായും നിങ്ങളുടെ ആരോഗ്യം, ആർത്തവചക്രം, പിസിഒഎസ്, ജീവിതശൈലി എന്നിവയിൽ മാത്രമാണ്. എനിക്ക് പ്രോഗ്രാമിംഗ് കോഡ് നിർമ്മിക്കാൻ കഴിയില്ല. 🌸\n\nഇന്ന് നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്? നിങ്ങളുടെ ആരോഗ്യത്തെക്കുറിച്ചോ ജീവിതശൈലിയെക്കുറിച്ചോ നമുക്ക് സംസാരിക്കാം.",

  Marathi:
    "मला आपल्याला मदत करण्यात अत्यंत आनंद होईल, परंतु आपली वैयक्तिक आरोग्य व वेलनेस सोबती म्हणून माझे सर्व लक्ष आपल्या आरोग्यावर, मासिक पाळी चक्र, पीसीओएस आणि जीवनशैलीच्या काळजीवर केंद्रित आहे. मी सॉफ्टवेअर कोड किंवा प्रोग्रामिंग लिहू शकत नाही. 🌸\n\nकृपया सांगा, आज आपल्याला कसे वाटत आहे? आपल्या आरोग्याविषयी किंवा चांगल्या सवयींविषयी आपण चर्चा करूया का?",

  Bengali:
    "আপনাকে সহায়তা করতে পেরে আমি আনন্দিত হব, তবে আপনার একান্ত স্বাস্থ্য ও সুস্থতার সঙ্গী হিসেবে আমার সম্পূর্ণ মনোযোগ আপনার শারীরিক সুস্থতা, মাসিক চক্র, পিসিওএস এবং জীবনযাত্রার যত্নে নিবেদিত। আমি কোনো প্রোগ্রামিং কোড বা সফটওয়্যার স্ক্রিপ্ট লিখতে পারি না। 🌸\n\nদয়া করে জানান আজ আপনার কেমন লাগছে? আপনার স্বাস্থ্য, পুষ্টি বা কোনো সুস্থতার লক্ষ্য নিয়ে আমরা কি কথা বলতে পারি?",

  Gujarati:
    "મને તમારી મદદ કરવામાં ખૂબ આનંદ થશે, પરંતુ તમારા અંગત આરોગ્ય અને સુખાકારી સાથી તરીકે, મારું સંપૂર્ણ ધ્યાન તમારા સ્વાસ્થ્ય, માસિક ચક્ર, પીસીઓએસ અને જીવનશૈલીની સંભાળ પર કેન્દ્રિત છે. હું કોમ્પ્યુટર કોડિંગ અથવા પ્રોગ્રામિંગ કરી શકતી નથી. 🌸\n\nઆજે તમે કેવું અનુભવો છો? શું કોઈ સ્વાસ્થ્ય લક્ષ્ય, લક્ષણ અથવા દૈનિક આદત વિશે આપણે વાત કરીએ?",

  Arabic:
    "يسعدني جداً مساعدتك، ولكن بصفتي رفيقتكِ المخلصة للصحة والعافية، فإن كامل اهتمامي مكرس لدعم صحتكِ، الدورة الشهرية، متلازمة تكيس المبايض ونمط حياتكِ الصحي. لا يمكنني كتابة أو تصحيح أي كود برمجي. 🌸\n\nكيف تشعرين اليوم؟ هل هناك أي هدف صحي، عرض، أو عادة يومية تودين استكشافها معاً؟",

  Portuguese:
    "Terei o maior prazer em ajudar você, mas como sua companheira pessoal de saúde e bem-estar, minha dedicação é exclusiva aos seus cuidados de saúde, ciclo menstrual, SOP e hábitos de vida saudáveis. Não posso escrever, explicar ou depurar código de programação. 🌸\n\nComo você está se sentindo hoje? Há algum sintoma, rotina ou meta de bem-estar que gostaria de conversar?",
};

/**
 * Normalizes input language string, native script name, or ISO code to canonical language key.
 */
export function normalizeLanguageKey(language?: string): string {
  if (!language || typeof language !== 'string') return 'English';
  const clean = language.trim().toLowerCase();

  // English
  if (clean === 'en' || clean === 'eng' || clean === 'english') return 'English';

  // Hindi
  if (clean === 'hi' || clean === 'hin' || clean === 'hindi' || clean === 'हिंदी' || clean === 'हिन्दी' || clean.includes('devanagari')) return 'Hindi';

  // Telugu
  if (clean === 'te' || clean === 'tel' || clean === 'telugu' || clean === 'తెలుగు') return 'Telugu';

  // Tamil
  if (clean === 'ta' || clean === 'tam' || clean === 'tamil' || clean === 'தமிழ்') return 'Tamil';

  // Spanish
  if (clean === 'es' || clean === 'spa' || clean === 'spanish' || clean === 'español' || clean === 'espanol') return 'Spanish';

  // French
  if (clean === 'fr' || clean === 'fra' || clean === 'fre' || clean === 'french' || clean === 'français' || clean === 'francais') return 'French';

  // German
  if (clean === 'de' || clean === 'deu' || clean === 'ger' || clean === 'german' || clean === 'deutsch') return 'German';

  // Kannada
  if (clean === 'kn' || clean === 'kan' || clean === 'kannada' || clean === 'ಕನ್ನಡ') return 'Kannada';

  // Malayalam
  if (clean === 'ml' || clean === 'mal' || clean === 'malayalam' || clean === 'മലയാളം') return 'Malayalam';

  // Marathi
  if (clean === 'mr' || clean === 'mar' || clean === 'marathi' || clean === 'मराठी') return 'Marathi';

  // Bengali
  if (clean === 'bn' || clean === 'ben' || clean === 'bengali' || clean === 'বাংলা' || clean === 'bangla') return 'Bengali';

  // Gujarati
  if (clean === 'gu' || clean === 'guj' || clean === 'gujarati' || clean === 'ગુજરાતી') return 'Gujarati';

  // Arabic
  if (clean === 'ar' || clean === 'ara' || clean === 'arabic' || clean === 'العربية' || clean === 'عربي') return 'Arabic';

  // Portuguese
  if (clean === 'pt' || clean === 'por' || clean === 'portuguese' || clean === 'português' || clean === 'portugues') return 'Portuguese';

  const titleCase = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (POLITE_NO_CODE_REFUSALS[titleCase]) {
    return titleCase;
  }
  return 'English';
}

/**
 * Returns the polite refusal message tailored to the user's preferred language.
 */
export function getPoliteNoCodeRefusal(
  language: string = 'English',
  companionName: string = 'Luna',
  userName: string = 'there'
): string {
  const normLang = normalizeLanguageKey(language);
  return POLITE_NO_CODE_REFUSALS[normLang] || POLITE_NO_CODE_REFUSALS.English;
}

/**
 * Detects if an incoming user prompt is asking to write, generate, debug, explain,
 * or teach software programming code or technical scripts.
 *
 * Carefully protects genuine health inquiries (thyroid function, ovarian function,
 * workout programs, dietary macros, yoga classes, etc.) from false positive blocks.
 */
export function isCodingRequest(message: string): boolean {
  if (!message || typeof message !== 'string') return false;

  // Mask legitimate health, biological, fitness, and lifestyle phrases
  // so their natural terms ('function', 'program', 'macros', 'class') don't trigger coding filters.
  const sanitized = message
    // Biological & organ functions
    .replace(/\b(thyroid|ovarian|ovary|kidney|liver|brain|immune|hormone|hormonal|adrenal|pancreatic|metabolic|bodily|pulmonary|cardiac|digestive|reproductive|cellular|organ|organs|cognitive|pituitary|vascular|endothelial|bowel|bladder|placental)\s+functions?\b/gi, '')
    .replace(/\bfunctions?\s+of\s+(the\s+)?(thyroid|ovaries|ovary|kidneys?|liver|brain|immune\s+system|hormones?|adrenals?|pancreas|heart|body|cells?)\b/gi, '')
    // Fitness, workout, exercise, walking, and wellness programs
    .replace(/\b(fitness|workout|exercise|walking|wellness|health|yoga|pilates|weight\s+loss|lifestyle|stretching|strength|cardio|rehab|recovery|sleep|nutrition|diet|meal)\s+programs?\b/gi, '')
    .replace(/\bprograms?\s+(for|of)\s+(fitness|wellness|health|pcos|cycle|exercise|walking|weight\s+loss|sleep)\b/gi, '')
    // Dietary macros (macronutrients: protein, carbs, fats)
    .replace(/\b(dietary|daily|food|nutrition|my|the|count|track|calculate|provide|give\s+me|suggest)\s+(my\s+)?macros?\b/gi, '')
    .replace(/\bmacros?\s+(for|split|goals?|intake|tracking|ratio|breakdown)\b/gi, '')
    .replace(/\bmacronutrients?\b/gi, '')
    // Fitness, yoga, wellness classes and medical symptom classifications
    .replace(/\b(yoga|pilates|fitness|aerobics|spin|dance|meditation|cooking|prenatal|birthing|exercise|gym|workout|master)\s+class[es]?\b/gi, '')
    .replace(/\bclass\s+([0-9]+|[a-zA-Z]|[ivxIVX]+)\b/gi, '')
    // Learning & tutoring health topics
    .replace(/\b(teach|tutor|help\s+me\s+learn|learn)\s+(me\s+)?(how\s+to\s+)?(track|breathe|eat|manage|balance|understand|cook|cope)\b/gi, '')
    .replace(/\b(teach|tutor)\s+(me\s+)?(about\s+)?(pcos|ovulation|pregnancy|fertility|hormones|nutrition|gut\s+health|insulin|sleep|stress|cycle|menstruation|diet|wellness|health|supplements|vitamins)\b/gi, '')
    // Codes of conduct, dress codes, qr/bar/zip codes
    .replace(/\b(code\s+of\s+(conduct|ethics)|dress\s+code|qr\s+code|bar\s+code|zip\s+code|area\s+code|discount\s+code|coupon\s+code|promo\s+code)\b/gi, '');

  const lower = sanitized.toLowerCase();

  // Programming language tokens
  const progLangsWord = 'python|javascript|typescript|js|ts|html|css|sql|cpp|golang|go|rust|bash|shell|powershell|php|ruby|swift|kotlin|java|react|vue|angular|node(?:\\s*\\.js)?|dart|flutter|scala|lua|matlab';
  const progLangs = `(?:\\b(?:${progLangsWord})\\b|\\b(?:c\\+\\+|c#)(?![a-zA-Z0-9_]))`;

  // 1. Direct explicit requests to write / generate / create / explain / debug code or scripts
  const explicitCodePatterns = [
    /\b(write|create|generate|provide|give me|show me|draft|compose|produce)\s+(me\s+)?(an?\s+|some\s+|the\s+)?(?:[a-zA-Z_-]+\s+){0,3}(code|script|scripts|program|programme|programs|function|functions|algorithm|algorithms|class|classes|software|query|queries|regex|regular\s+expression|snippet|snippets)\b/i,
    /\b(can you|could you|please|kindly|help me(\s+to)?|do you know how to)\s+(write|create|generate|give me|code|program)\s+(an?\s+|some\s+)?(?:[a-zA-Z_-]+\s+){0,3}(code|script|program|function|algorithm|software|query|snippet)\b/i,
    /\b(explain|debug|fix|refactor|compile|optimize|review|format|walk me through)\s+(my|this|the)?\s*(?:[a-zA-Z_-]+\s+){0,3}(code|script|scripts|function|functions|program|programs|algorithm|algorithms|syntax error|query|queries|regex|snippet|snippets)\b/i,
    /\bwhat\s+does\s+this\s+(?:[a-zA-Z_-]+\s+){0,2}(code|script|function|program|algorithm|snippet)\s+do\b/i,
    /\b(code|program)\s+(me|this|for me|an app|a tool|a script|a solution)\b/i,
    /\b(how to (write|code|program|implement)\b.*\b(function|script|algorithm|class|loop|array|regex)\b)/i,
    /\b(write|make|build)\s+(an?\s+)?(website|web page|landing page|app|backend|api)\s+(code|in html|in react|in python|in javascript)\b/i,
    /\b(coding challenge|leetcode|hackerrank|codeforces|codewars)\b/i,
    /\b(programming task|coding question|programming assignment|coding assignment|coding homework|programming homework)\b/i,
    /\b(write|generate|give me|provide|produce)\s+(an?\s+|some\s+)?code\b/i,
    /\b(can\s+you\s+code|can\s+you\s+program|do\s+you\s+code|do\s+you\s+know\s+how\s+to\s+code|do\s+you\s+know\s+how\s+to\s+program)\b/i,
    /\b(can\s+you|do\s+you|are\s+you\s+able\s+to)\s+(do\s+|know\s+how\s+to\s+)?(coding|programming)\b/i,
    /\bwrite\s+code\b/i,
    /\bgenerate\s+code\b/i,
    // Coding instruction and tutoring requests
    /\b(teach|instruct|tutor|train)\s+(me\s+)?(to\s+|how\s+to\s+)?(code|program|develop|script)\b/i,
    /\b(teach|tutor)\s+(me\s+)?(about\s+|some\s+)?(coding|programming|software\s+development)\b/i,
    new RegExp(`\\b(teach|tutor|instruct)\\s+(me\\s+)?(in\\s+|about\\s+)?${progLangs}`, 'i'),
    new RegExp(`\\b(i\\s+want\\s+to\\s+learn|help\\s+me\\s+learn|learn)\\s+(how\\s+to\\s+)?(code|program|coding|programming|${progLangsWord}|c\\+\\+|c#)(?![a-zA-Z0-9_])`, 'i'),
    /\b(help\s+me\s+with\s+)?(my\s+)?(coding|programming)\s+(homework|assignment|project|task|problem|exercise|exam|test)\b/i,
    // Database queries, regex, and macro requests
    /\b(database|db|sql)\s+(query|queries|script)\b/i,
    /\bwrite\s+(a\s+|an\s+)?sql\s+query\b/i,
    /\bwrite\s+(a\s+)?regex\b/i,
    /\b(excel|vba)\s+macro[s]?\b/i,
  ];

  for (const pattern of explicitCodePatterns) {
    if (pattern.test(sanitized)) return true;
  }

  // 2. Programming language mentions combined with code/programming actions or artifacts
  const artifacts = 'code|script|scripts|program|programme|skript|programm|function|functions|query|queries|snippet|snippets|algorithm|algorithms|syntax|file|files|component|components|page|pages';

  const langWithArtifact = new RegExp(
    `${progLangs}\\s+(${artifacts})\\b`,
    'i'
  );
  if (langWithArtifact.test(sanitized)) return true;

  const artifactWithLang = new RegExp(
    `\\b(${artifacts})\\s+(in|using|with|de|en|pour|für)?\\s*${progLangs}`,
    'i'
  );
  if (artifactWithLang.test(sanitized)) return true;

  const actionWithLang = new RegExp(
    `\\b(write|generate|code|create|give me|show me|build|debug|run|explain)\\s+(me\\s+)?(something\\s+)?(in\\s+)?(an?\\s+|some\\s+)?${progLangs}`,
    'i'
  );
  if (actionWithLang.test(sanitized)) return true;

  // 3. Multilingual coding request patterns
  const multilingualPatterns = [
    // Hindi / Hinglish
    /(कोड\s*(लिख|बना|दीजिए|दो|सिखाओ|सिखाइए|चाहिए)|पायथन\s*कोड|प्रोग्राम\s*(लिख|बना|सिखाओ)|प्रोग्रामिंग\s*(सिखाओ|सिखाइए|करो|करते)|कोडिंग\s*(सिखाओ|सिखाइए|करो|बताओ)|सॉफ्टवेयर\s*(बना|लिख)|code\s*(likho|banao|dijiye|likh|sikhao|do|chahiye)|coding\s*(sikhao|sikha do|sikhaye|karo)|programming\s*(sikhao|karo))/i,
    // Telugu / Telugish
    /(కోడ్\s*(రాయి|రాయండి|చేయి|చేయండి|ఇవ్వు|ఇవ్వండి|నేర్పించు)|కోడింగ్\s*(రాయి|రాయండి|చేయి|చేయండి|నేర్పించు)|సాఫ్ట్‌వేర్\s*కోడ్|code\s*(rayi|rayandi|chey|cheyandi|ivvandi|nerpincu)|coding\s*(rayi|rayandi|nerpincu))/i,
    // Tamil
    /(குறியீடு\s*(எழுது|எழுதுங்கள்|உருவாக்கு)|நிரல்\s*(எழுது)|code\s*(ezhuthu|ezhudhu|uruvakku)|coding\s*(solli|padikk))/i,
    // Spanish
    /(escrib(e|ir|a)|gener(ar|a)|cre(ar|a)|haz(me)?|dame|explic(ar|a)|depur(ar|a)|ens[eé]ñ(ar|a|ame)|aprend(er))\s+(un\s+|una\s+)?(c[oó]digo|script|programa|funci[oó]n|a\s+programar|programaci[oó]n)/i,
    /(c[oó]digo\s+(en\s+)?(python|javascript|html|css|sql|java|c\+\+|react))/i,
    /(program(ar|a)\s+(un\s+|una\s+)?(app|aplicaci[oó]n|software|web))/i,
    /(ens[eé]ñame|ensename)\s+(a\s+)?programar/i,
    /(puedes\s+programar|sabe\s+programar)/i,
    // French
    /(écri(re|s|vez|t)?|génér(er|e|ez)?|cré(er|e|ez)?|expliqu(er|e|ez)?|enseign(er|e|ez)?|apprend(re)?)([- ](moi|nous))?\s+(un\s+|une\s+|du\s+|le\s+|la\s+)?(code|programme|script|fonction|à\s+programmer|programmation)/i,
    /(enseigne-moi|apprends-moi)\s+(la\s+)?programmation/i,
    // German
    /(schreib(e|en|t)?|erstell(e|en|t)?|programmier(e|en|t)?|erklär(e|en|t)?|bring(en)?[- ](mir|uns)[- ]bei|lernen)([- ](mir|uns))?\s+(ein(en|e|em)?\s+)?(code|skript|programm|funktion|programmieren|das\s+programmieren)/i,
    /(bring\s+mir\s+programmieren\s+bei)/i,
    // Kannada
    /(ಕೋಡ್\s*(ಬರೆ|ಬರೆಯಿರಿ|ಮಾಡು)|code\s*(bare|bareyiri|maadu))/i,
    // Malayalam
    /(കോഡ്\s*(എഴുതുക|തരിക|ഉണ്ടാക്കുക)|code\s*(ezhuthu|ezhuthuka))/i,
    // Marathi
    /(कोड\s*(लिहा|करा|द्या)|code\s*(liha|kara|dya))/i,
    // Bengali
    /(কোড\s*(লিখুন|তৈরি করুন|দিন)|code\s*(likhun|likho|banao))/i,
    // Gujarati
    /(કોડ\s*(લખો|બનાવો|આપો)|code\s*(lakho|banavo|aapo))/i,
    // Arabic
    /(اكتب|انشئ|برمج|اعطني|اشرح|علمني)\s+(كود|برنامج|سكربت|شفرة برمجية|دالة|البرمجة)/i,
    // Portuguese
    /(escrev(a|er)|ger(ar|e)|cri(ar|e)|faça|explic(ar|e)|ensin(ar|e)|aprend(er))\s+(um\s+|uma\s+)?(c[oó]digo|script|programa|função|a\s+programar|programação)/i,
  ];

  for (const pattern of multilingualPatterns) {
    if (pattern.test(sanitized)) return true;
  }

  // 4. Standalone concise triggers
  if (/\b(write\s+code|code\s+please|can\s+you\s+code|can\s+you\s+write\s+code|teach\s+me\s+code)\b/i.test(lower)) {
    return true;
  }

  return false;
}

/**
 * Checks if a response generated by an AI model contains leaked code,
 * markdown code blocks, or programming scripts.
 */
export function containsCode(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  // 1. Markdown code fences (e.g. ```python ... ``` or ``` ... ``` or ~~~python ... ~~~)
  if (/```[\s\S]*?```/.test(text) || /```[a-zA-Z0-9_-]*/.test(text)) {
    return true;
  }
  if (/~~~[\s\S]*?~~~/.test(text) || /~~~[a-zA-Z0-9_-]*/.test(text)) {
    return true;
  }

  // 2. HTML script / style / code / boilerplate blocks
  if (/<script\b[\s\S]*?(<\/script>|>)/i.test(text)) return true;
  if (/<style\b[\s\S]*?(<\/style>|>)/i.test(text)) return true;
  if (/<!DOCTYPE\s+html>/i.test(text) || /<html[\s>]/i.test(text)) return true;
  if (/<pre><code>[\s\S]*?<\/code><\/pre>/i.test(text)) return true;
  if (/<code[\s>][\s\S]*?<\/code>/i.test(text)) return true;

  // 3. PHP blocks
  if (/<\?php|<\?=/i.test(text)) return true;

  // 4. Package manager commands & shell commands
  if (/(^|\n)\s*(pip|pip3)\s+install\s+[a-zA-Z0-9_.-]+/m.test(text)) return true;
  if (/(^|\n)\s*(npm|pnpm|yarn|bun)\s+(install|add|run|build|test)\s+[a-zA-Z0-9_@/-]+/m.test(text)) return true;

  // 5. Distinct programming function / class / declaration signatures
  const codeSignatures = [
    // Python lowercase def/class with optional parameter types and return type annotations (-> type:), supports async def
    /(^|\n)\s*(async\s+)?def\s+[a-zA-Z_]\w*\s*\([^)]*\)(\s*->\s*[^:]+)?\s*:/m,
    /(^|\n)\s*class\s+[a-zA-Z_]\w*(\s*\([^)]*\))?\s*:/m,
    // JS/TS/Java/C#/C++ class declarations with access modifiers
    /(^|\n)\s*(public|private|protected|internal|abstract|final|static)?\s*(export\s+(default\s+)?)?class\s+[a-zA-Z_]\w*(\s+extends\s+[a-zA-Z_]\w*)?(\s+implements\s+[^{]+)?\s*\{/m,
    // JS/TS functions including typed return signatures and export keywords
    /(^|\n)\s*(export\s+(default\s+)?)?(async\s+)?function(\s+[a-zA-Z_]\w*)?\s*\([^)]*\)(\s*:\s*[^{]+)?\s*\{/m,
    // Rust fn and Go/Swift func definitions
    /(^|\n)\s*(pub\s+)?fn\s+[a-zA-Z_]\w*\s*(\([^)]*\)|\()/m,
    /(^|\n)\s*func\s+(\([^)]*\)\s*)?[a-zA-Z_]\w*\s*\(/m,
    // JS/TS variable declaration and arrow functions including exports
    /(^|\n)\s*(export\s+)?(const|let|var)\s+[a-zA-Z_]\w*(\s*:\s*[^=]+)?\s*=\s*(\([^)]*\)|[a-zA-Z_]\w*)(\s*:\s*[^=]+)?\s*=>/m,
    // Package and using statements (Go, Java, C#, C++)
    /(^|\n)\s*package\s+[a-zA-Z_]\w*(\s*;\s*|\s*\n)/m,
    /(^|\n)\s*using\s+(System|std|[a-zA-Z_]\w*);/m,
    /(^|\n)\s*namespace\s+[a-zA-Z_]\w*\s*\{/m,
    // JS and Python import statements
    /(^|\n)\s*(import\s+.*?from\s+['"].*?['"]|import\s+[a-zA-Z0-9_]+(\s+as\s+[a-zA-Z0-9_]+)?|from\s+[a-zA-Z0-9_.]+\s+import\s+)/m,
    // C/C++ includes and main function
    /(^|\n)\s*#include\s+[<"][a-zA-Z0-9_.]+[>"]/m,
    /(^|\n)\s*(int|void)\s+main\s*\([^)]*\)\s*\{/m,
    // Java main
    /(^|\n)\s*public\s+static\s+void\s+main/m,
    // Standard print / logging calls
    /(^|\n)\s*(console\.(log|error|warn|info|debug)\(|System\.(out|err)\.println\(|fmt\.Print(ln|f)?\(|print\s*\([fFrRuUbB]?["'`])/m,
    // Loops and control flow
    /(^|\n)\s*for\s*\(\s*(let|var|int)\s+[a-zA-Z_]\w*\s*=\s*0;/m,
    /(^|\n)\s*(for\s+[a-zA-Z_]\w*\s+in\s+range\([^)]*\)\s*:|while\s+True\s*:|if\s+__name__\s*==\s*['"]__main__['"]\s*:)/m,
    // Context managers & exception blocks
    /(^|\n)\s*with\s+open\s*\([^)]*\)\s*as\s+[a-zA-Z_]\w*\s*:/m,
    /(^|\n)\s*try\s*:\s*\n[\s\S]*?\n\s*except\b/m,
    /(^|\n)\s*try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{/m,
    // Dockerfile instructions
    /(^|\n)\s*(FROM\s+[a-zA-Z0-9_./:-]+|WORKDIR\s+[\w/.]+|RUN\s+(apt-get|pip|npm|yarn|cargo|apk)\s+|EXPOSE\s+\d{2,5})/m,
    // Shell execution & download commands
    /(^|\n)\s*(curl\s+(-[a-zA-Z]+\s+)?https?:\/\/|wget\s+https?:\/\/|chmod\s+(\+x|[0-7]{3,4})\s+|git\s+clone\s+)/m,
    // Shell scripts and shebang lines
    /(^|\n)\s*#!\s*(\/usr)?\/bin\/(bash|sh|zsh|env\s+python|env\s+node)/m,
    // SQL DDL/DML statements (STRICT UPPERCASE to avoid false positives on conversational English)
    /(^|\n)\s*(SELECT\s+[\w*,\s]+\s+FROM|INSERT\s+INTO\s+[a-zA-Z_]\w+|UPDATE\s+[a-zA-Z_]\w+\s+SET|DELETE\s+FROM\s+[a-zA-Z_]\w+|CREATE\s+TABLE\s+[a-zA-Z_]\w+|DROP\s+TABLE\s+[a-zA-Z_]\w+|ALTER\s+TABLE\s+[a-zA-Z_]\w+|TRUNCATE\s+TABLE\s+[a-zA-Z_]\w+)\b/m,
  ];

  for (const sig of codeSignatures) {
    if (sig.test(text)) return true;
  }

  return false;
}

/**
 * Backend guardrail: inspects AI response text, intercepts any leaked code blocks
 * or programming scripts, and replaces them with a warm, polite refusal guiding
 * the user back to health and wellness.
 */
export function applyCodeGuardrail(
  responseText: string,
  language: string = 'English',
  companionName?: string,
  userName?: string
): GuardrailCheckResult {
  if (!containsCode(responseText)) {
    return {
      isClean: true,
      content: responseText,
      intercepted: false,
    };
  }

  // Leaked code detected: Intercept and provide reliable polite fallback
  const fallback = getPoliteNoCodeRefusal(language, companionName, userName);
  return {
    isClean: false,
    content: fallback,
    intercepted: true,
    reason: 'Model output contained code blocks or programming syntax.',
  };
}
