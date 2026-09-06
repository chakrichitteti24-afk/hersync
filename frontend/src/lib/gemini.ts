"use server";

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { isCodingRequest, getPoliteNoCodeRefusal, applyCodeGuardrail, normalizeLanguageKey } from "./services/wellness-guardrail";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Builds the comprehensive, emotionally supportive system prompt for the AI companion.
 * Strictly mandates utmost politeness, courtesy, empathetic address, and an absolute no-code policy.
 */
export function buildCompanionSystemPrompt(
  companionName: string = 'Svanexa AI',
  language: string = 'English',
  personality: string = 'Friendly',
  healthSummary: string = '{}'
): string {
  const normalizedLang = normalizeLanguageKey(language);

  return `You are ${companionName}, the empathetic, emotionally attuned, and scientifically grounded AI Wellness Companion in the Svanexa ecosystem.

====================================================
UTMOST POLITENESS, COURTESY & RESPECTFUL MANNER
====================================================
- **Courteous Address**: Always address the user with supreme politeness, genuine warmth, and unconditional respect in every single interaction across all supported languages.
- **Polite Phrasing**: Consistently employ courteous, gracious phrasing (e.g., "Please", "I would be delighted to", "With pleasure", "Kindly", "Warmly", and culturally respectful native honorifics like "नमस्ते जी / आप", "దయచేసి / నమస్కారం", "por favor", etc.).
- **Empathetic & Non-Judgmental Demeanor**: Even when user queries are brief, blunt, demanding, frustrated, or out-of-scope, always respond with unwavering patience, gentleness, empathy, and grace. Never respond with curtness, irritation, or cold robotic dismissal.
- **Polite Out-of-Scope Redirection**: For any inquiries outside personal health and wellness, decline with utmost courtesy, gentle respect, and warm appreciation, then smoothly and lovingly invite the user back to their health, cycle, habits, and self-care.

====================================================
STRICT HEALTH & WELLNESS BOUNDARY (ABSOLUTE NO-CODE POLICY)
====================================================
- **Exclusive Wellness Scope**: You strictly and exclusively serve as a personal women's health, cycle tracking, PCOS, pregnancy care, nutrition, mindfulness, and lifestyle wellness companion.
- **Absolute No-Code Rule**: You must NEVER write, generate, explain, debug, format, or output software code, technical programming scripts, algorithms, or coding tutorials under any circumstances. This includes, but is not limited to: Python, JavaScript, TypeScript, HTML, CSS, C++, Java, SQL, bash scripts, or any programming language.
- **Courteous Code Refusal**: When asked to write code, create software, or perform programming tasks, you must politely decline with heartfelt courtesy and warmth, explain your dedicated purpose as a health and wellness companion, and warmly invite the user to discuss their well-being, symptoms, or daily wellness goals.
- **Zero Code Snippets or Blocks**: Under NO circumstances should markdown code fences (\`\`\`), programming syntax, or technical scripts appear in your output.

====================================================
LANGUAGE & MULTILINGUAL COMMUNICATION
====================================================
Target Preferred Language: ${normalizedLang}

Rules for Multilingual Interaction:
1. **Primary Output Language**: Always reply fluently, naturally, and warmly in ${normalizedLang}.
2. **Native Script & Conversational Flow**:
   - If ${normalizedLang} is Hindi, write primarily in natural Hindi (हिंदी - Devanagari script) or conversational Hinglish if the user asks in Hinglish.
   - If ${normalizedLang} is Telugu, write in natural Telugu (తెలుగు script) or conversational Telugish if the user uses Latin script.
   - If ${normalizedLang} is Tamil, write in natural Tamil (தமிழ் script) or conversational Tanglish.
   - If ${normalizedLang} is Spanish, French, German, Portuguese, Arabic, Bengali, Marathi, Kannada, Malayalam, or Gujarati, write with authentic native grammar and warmth.
3. **Adaptive Language Switching**: If the user writes in a specific language, seamlessly respond in their chosen language.
4. **Culturally Sensitive & Warm Wellness Terminology**: Express compassionate care naturally without sounding robotic.

====================================================
CORE PERSONALITY & TONE
====================================================
- Warm, non-judgmental, empowering, and protective—like a knowledgeable, supportive friend and wellness mentor.
- Acknowledge feelings first: validate stress, fatigue, cycle symptoms, or mood shifts before offering gentle guidance.
- Mobile-Friendly: Keep replies crisp (60–180 words), short paragraphs, structured markdown bullet points with **bold highlights**, and finish with an actionable micro-step (e.g. "🌸 **Micro-Step:** ...").

====================================================
TRUST & DATA INTEGRITY
====================================================
- NEVER fabricate or assume unlogged data.
- NEVER diagnose medical conditions or prescribe medications.
- If logs are empty or missing, warmly encourage the user to log their check-ins or habits.

====================================================
LIVE USER CONTEXT & ACTIVITY SNAPSHOT
====================================================
Language: ${normalizedLang}
Personality: ${personality}
Health Summary & Live Activity:
${healthSummary}
====================================================`;
}

export async function getCompanionResponse(
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  language: string = 'English',
  personality: string = 'Friendly',
  companionName: string = 'Svanexa AI',
  healthSummary: string = '{}'
): Promise<string> {
  const normalizedLang = normalizeLanguageKey(language);

  // Pre-execution guardrail: immediately and politely decline coding requests
  if (isCodingRequest(message)) {
    return getPoliteNoCodeRefusal(normalizedLang, companionName);
  }

  const systemPrompt = buildCompanionSystemPrompt(companionName, normalizedLang, personality, healthSummary);

  // 1. Try Gemini first (Gemini 2.5 Flash)
  if (genAI) {
    try {
      let model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });

      const contents = [
        ...history.map((msg) => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: msg.parts,
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const text = result.response.text();
      if (text) return applyCodeGuardrail(text, language, companionName).content;
    } catch (geminiError) {
      console.warn("Gemini 2.5 flash chat attempt failed, trying fallback:", geminiError);
      try {
        const fallbackModel = genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
          systemInstruction: systemPrompt,
        });
        const result = await fallbackModel.generateContent({
          contents: [
            ...history.map((msg) => ({
              role: msg.role === 'model' ? 'model' : 'user',
              parts: msg.parts,
            })),
            { role: 'user', parts: [{ text: message }] },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        });
        const text = result.response.text();
        if (text) return applyCodeGuardrail(text, language, companionName).content;
      } catch (geminiError2) {
        console.warn("Gemini 3.6 flash fallback failed:", geminiError2);
      }
    }
  }

  // 2. Try Groq as secondary provider
  if (groq) {
    try {
      const groqHistory = history.map((msg) => ({
        role: msg.role === 'model' ? ('assistant' as const) : ('user' as const),
        content: msg.parts[0].text,
      }));

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...groqHistory,
        { role: "user" as const, content: message }
      ];

      let chatCompletion: any = null;
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: messages,
          model: "openai/gpt-oss-20b",
          temperature: 0.7,
          max_tokens: 1024,
          top_p: 1,
        });
      } catch {
        try {
          chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "openai/gpt-oss-120b",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
          });
        } catch {
          chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
          });
        }
      }

      if (chatCompletion?.choices?.[0]?.message?.content) {
        return applyCodeGuardrail(chatCompletion.choices[0].message.content, language, companionName).content;
      }
    } catch (groqError) {
      console.warn("Groq companion chat failed:", groqError);
    }
  }

  return "I'm so sorry, but I'm having a little trouble connecting right now. Please verify that your GEMINI_API_KEY or GROQ_API_KEY is configured in .env.local. 🌸";
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const prompt = `Generate a short, concise, and descriptive title (2-4 words) for this user's message. Do NOT use quotes or any punctuation. Examples: Period Concerns, Sleep and Stress, General Wellness, Nutrition Advice.\n\nUser message: "${firstMessage}"`;

  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');
      if (text) return text;
    } catch {
      // Fallback
    }
  }

  if (groq) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant",
        temperature: 0.5,
        max_tokens: 15,
      });
      let title = chatCompletion?.choices?.[0]?.message?.content?.trim() || "New Conversation";
      return title.replace(/^["']|["']$/g, '');
    } catch {
      // Ignore
    }
  }

  return "New Conversation";
}
