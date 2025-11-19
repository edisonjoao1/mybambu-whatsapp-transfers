import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type Language = 'en' | 'es';

interface ConversationContext {
  userPhone: string;
  language: Language;
  sessionStep: string;
  recentMessages?: string[];
}

/**
 * Detects the language of the input text
 * Returns 'es' for Spanish, 'en' for English
 */
export function detectLanguage(text: string): Language {
  // Common Spanish patterns
  const spanishPatterns = [
    /\b(hola|buenos|buenas|días|tardes|noches|gracias|por favor|ayuda|necesito|quiero|cuánto|dónde|cómo|qué|enviar|dinero|transferencia|pesos|sí|no)\b/i,
    /[áéíóúñ¿¡]/i,
  ];

  for (const pattern of spanishPatterns) {
    if (pattern.test(text)) {
      return 'es';
    }
  }

  return 'en';
}

/**
 * Formats bot messages with WhatsApp markdown and emojis
 */
export function formatBotMessage(message: string, language: Language): string {
  // Already formatted messages (with emojis) should be returned as-is
  if (message.includes('✅') || message.includes('📝') || message.includes('💰')) {
    return message;
  }

  // Add conversational touch based on language
  const greetings = language === 'es'
    ? ['¡Hola!', '¡Claro!', '¡Por supuesto!', 'Entiendo']
    : ['Hello!', 'Sure!', 'Of course!', 'I understand'];

  // Don't add greeting if message already has emojis or is very short
  if (message.length < 50) {
    return message;
  }

  return message;
}

/**
 * Calls OpenAI for general questions and conversation
 * Uses GPT-4 for better multi-lingual support and understanding
 */
export async function callOpenAI(
  userMessage: string,
  context: ConversationContext
): Promise<string> {
  try {
    const { language, sessionStep, userPhone } = context;

    // System prompt - defines bot behavior
    const systemPrompt = language === 'es'
      ? `Eres un asistente de MyBambu, una aplicación de transferencias de dinero internacional.

REGLAS IMPORTANTES:
- Habla en español de manera amigable y profesional
- Usa emojis ocasionalmente pero no en exceso
- Sé breve y conciso (máximo 2-3 oraciones)
- Si el usuario pregunta sobre transferencias, enviar dinero, o países, diles: "Para enviar dinero, escribe algo como: *Enviar $100 a México*"
- NUNCA inventes tasas de cambio, fees o precios - solo diles que escriban el comando de transferencia
- Puedes responder preguntas generales sobre el servicio
- Si no sabes algo, sé honesto

SERVICIOS:
- Transferencias a: México 🇲🇽, Colombia 🇨🇴, Brasil 🇧🇷, Reino Unido 🇬🇧, Europa 🇪🇺
- Modo actual: PRODUCCIÓN (transferencias reales)
- Integrado con Wise para tasas competitivas`
      : `You are an assistant for MyBambu, an international money transfer app.

IMPORTANT RULES:
- Speak in English in a friendly and professional manner
- Use emojis occasionally but not excessively
- Be brief and concise (max 2-3 sentences)
- If user asks about transfers, sending money, or countries, tell them: "To send money, type something like: *Send $100 to Mexico*"
- NEVER make up exchange rates, fees or prices - just tell them to type the transfer command
- You can answer general questions about the service
- If you don't know something, be honest

SERVICES:
- Transfers to: Mexico 🇲🇽, Colombia 🇨🇴, Brazil 🇧🇷, UK 🇬🇧, Europe 🇪🇺
- Current mode: PRODUCTION (real transfers)
- Powered by Wise for competitive rates`;

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Fast, cheap, good for conversations
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 150, // Keep responses concise
      temperature: 0.7, // Balanced creativity
    });

    const aiResponse = completion.choices[0]?.message?.content ||
      (language === 'es'
        ? 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?'
        : "Sorry, I couldn't process your message. Can you try again?");

    return aiResponse.trim();

  } catch (error: any) {
    console.error('❌ OpenAI Error:', error.message);

    // Fallback error message
    return context.language === 'es'
      ? '❌ Disculpa, tuve un problema. ¿Puedes intentar de nuevo?\n\nPara enviar dinero, escribe: *Enviar $100 a México*'
      : '❌ Sorry, I had an issue. Can you try again?\n\nTo send money, type: *Send $100 to Mexico*';
  }
}

/**
 * Generates formatted examples for transfer commands
 */
export function getTransferExamples(language: Language, country?: string): string {
  if (language === 'es') {
    const examples = country
      ? `*Ejemplos:*\n\`\`\`Enviar $100 a ${country}\`\`\`\n\`\`\`Transferir 50 USD a ${country}\`\`\``
      : `*Ejemplos:*\n\`\`\`Enviar $100 a México\`\`\`\n\`\`\`Transferir €50 a Colombia\`\`\`\n\`\`\`Mandar £200 a Brasil\`\`\``;

    return examples;
  } else {
    const examples = country
      ? `*Examples:*\n\`\`\`Send $100 to ${country}\`\`\`\n\`\`\`Transfer 50 USD to ${country}\`\`\``
      : `*Examples:*\n\`\`\`Send $100 to Mexico\`\`\`\n\`\`\`Transfer €50 to Colombia\`\`\`\n\`\`\`Send £200 to Brazil\`\`\``;

    return examples;
  }
}

/**
 * Country name translations
 */
export const COUNTRY_NAMES: Record<string, { en: string; es: string; flag: string }> = {
  'MXN': { en: 'Mexico', es: 'México', flag: '🇲🇽' },
  'COP': { en: 'Colombia', es: 'Colombia', flag: '🇨🇴' },
  'BRL': { en: 'Brazil', es: 'Brasil', flag: '🇧🇷' },
  'GBP': { en: 'United Kingdom', es: 'Reino Unido', flag: '🇬🇧' },
  'EUR': { en: 'Europe', es: 'Europa', flag: '🇪🇺' },
};

/**
 * Gets localized country name
 */
export function getCountryName(currencyCode: string, language: Language): string {
  const country = COUNTRY_NAMES[currencyCode];
  if (!country) return currencyCode;

  return language === 'es' ? country.es : country.en;
}

/**
 * Gets country flag emoji
 */
export function getCountryFlag(currencyCode: string): string {
  return COUNTRY_NAMES[currencyCode]?.flag || '🌍';
}
