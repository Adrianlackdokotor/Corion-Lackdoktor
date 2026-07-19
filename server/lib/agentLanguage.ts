/**
 * Lightweight language detection and instruction builder for agent prompts.
 *
 * Rule priority:
 *   1. Language of the current user input (pattern-based detection)
 *   2. Explicit fallback language if detection is not confident
 *   3. System default (German) as last resort
 *
 * No external NLP library — pattern-based detection covers the languages
 * relevant to Corion's operational context (DE, EN, RO).
 */

export interface DetectedLanguage {
  lang: string;    // ISO 639-1 code
  name: string;    // human-readable name for injection into prompts
  confident: boolean;
}

const LANG_PROFILES: Array<{
  lang: string;
  name: string;
  weight: number;
  patterns: RegExp[];
}> = [
  {
    lang: "de",
    name: "Deutsch",
    weight: 1,
    patterns: [
      // High-frequency German function words
      /\b(wie|was|wann|warum|welche[rms]?|ist|sind|haben|hat|war|werden|würde|kann|soll|muss|ich|du|er|sie|wir|ihr|bitte|danke|nicht|und|oder|aber|auch|noch|schon|doch|immer|alle|kein|keine|mehr|wenig|viel|sehr|hier|dort|jetzt|heute|morgen|gestern|wieder|schon|noch|bis|seit|nach|vor|mit|ohne|für|gegen|über|unter|bei|von|zu|aus|an|auf|in|um|durch)\b/gi,
      // German-specific characters
      /[äöüßÄÖÜ]/g,
    ],
  },
  {
    lang: "en",
    name: "English",
    weight: 1,
    patterns: [
      // High-frequency English function words
      /\b(what|why|when|how|which|where|who|whose|is|are|was|were|have|has|had|will|would|can|could|should|must|the|a|an|and|or|but|not|with|for|to|from|of|in|on|at|by|this|that|these|those|it|its|we|you|they|our|your|their|be|been|being|do|does|did)\b/gi,
    ],
  },
  {
    lang: "ro",
    name: "Română",
    weight: 1,
    patterns: [
      // High-frequency Romanian function words
      /\b(ce|cum|când|unde|cine|de ce|este|sunt|are|avem|aveți|nu|și|sau|dar|cu|pentru|din|la|în|pe|al|ale|lui|ei|lor|mai|foarte|acum|azi|mâine|care|acest|această|acești|aceste|toate|toți)\b/gi,
      // Romanian-specific diacritics
      /[ăâîșțĂÂÎȘȚ]/g,
    ],
  },
];

const DEFAULT_LANG: DetectedLanguage = { lang: "de", name: "Deutsch", confident: false };

/**
 * Detects the most likely language of a short user text.
 * Returns a low-confidence German result when detection is ambiguous.
 */
export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length < 3) return DEFAULT_LANG;

  const scores: Record<string, number> = {};

  for (const profile of LANG_PROFILES) {
    let score = 0;
    for (const pattern of profile.patterns) {
      // Reset lastIndex for global regexes used across calls
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches) score += matches.length * profile.weight;
    }
    if (score > 0) scores[profile.lang] = score;
  }

  if (Object.keys(scores).length === 0) return DEFAULT_LANG;

  const [bestLang, bestScore] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const secondBest = Object.entries(scores).sort((a, b) => b[1] - a[1])[1];

  // Require the best score to be meaningfully higher than the runner-up
  // to avoid false confidence on short inputs like "ok" or "ja"
  const isConfident = !secondBest || bestScore >= secondBest[1] * 1.5 || bestScore >= 3;

  const profile = LANG_PROFILES.find(p => p.lang === bestLang)!;
  return { lang: bestLang, name: profile.name, confident: isConfident };
}

/**
 * Returns a one-line language instruction for injection at the top of any
 * agent system prompt. Detects from userText; falls back to fallbackLang.
 *
 * Usage:
 *   const langLine = buildLanguageInstruction(userQuestion);
 *   const systemPrompt = `${langLine}\n\n...rest of prompt...`;
 */
export function buildLanguageInstruction(
  userText: string,
  fallbackLang = "de",
): string {
  const detected = detectLanguage(userText);
  const effective = detected.confident ? detected : (
    LANG_PROFILES.find(p => p.lang === fallbackLang)
      ? { lang: fallbackLang, name: LANG_PROFILES.find(p => p.lang === fallbackLang)!.name, confident: false }
      : DEFAULT_LANG
  );
  return `LANGUAGE RULE: Respond exclusively in ${effective.name}. The user wrote in ${effective.name}. Do not switch languages under any circumstances.`;
}
