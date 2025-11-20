import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI Prompt and Vector Store IDs (with Wise documentation)
const PROMPT_ID = 'pmpt_68e44e2add9c8194abed50d5d484025b03488bee75140d48';
const PROMPT_VERSION = '42';
const VECTOR_STORE_ID = 'vs_68e3f6dcb8f88191847f28999b99b50c';

export type Language = 'en' | 'es';

interface ConversationContext {
  userPhone: string;
  language: Language;
  sessionStep: string;
  recentMessages?: string[];
  transferDetails?: {
    amount?: number;
    country?: string;
    currency?: string;
    recipientName?: string;
  };
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
    const { language, sessionStep, userPhone, recentMessages, transferDetails } = context;

    // Log transfer details for tracking (not sent to AI)
    if (transferDetails) {
      console.log('📊 User context:', {
        phone: userPhone,
        amount: transferDetails.amount,
        country: transferDetails.country,
        recipient: transferDetails.recipientName,
        step: sessionStep
      });
    }

    // Minimal system prompt - let vector store examples guide behavior
    const systemPrompt = language === 'es'
      ? `Eres un asistente de soporte para el BOT DE WHATSAPP de MyBambu.

IMPORTANTE - ESTE BOT ESPECÍFICO:
- Este bot de WhatsApp soporta 9 países: México 🇲🇽, Colombia 🇨🇴, Brasil 🇧🇷, Costa Rica 🇨🇷, Uruguay 🇺🇾, Argentina 🇦🇷, Chile 🇨🇱, Reino Unido 🇬🇧, Europa 🇪🇺
- Usa la API de Wise para estas transferencias
- Si preguntan por otros países latinoamericanos (como Perú, Ecuador, etc.): "Este bot de WhatsApp solo maneja estos 7 países de América Latina. Para otros países, usa la app principal de MyBambu"

NOTA: La base de conocimiento menciona 13 países - eso es para MyBambu en general (otros servicios). Este bot de WhatsApp es específico.

- Habla español de forma amigable y profesional
- Ayuda con preguntas sobre transferencias, errores y procesos
- Sé breve y claro (2-3 oraciones)
- Usa ejemplos generales de la base de conocimiento, pero adapta al contexto de este bot

Para empezar: "Enviar $100 a México"`
      : `You are a support agent for the MyBambu WHATSAPP BOT.

IMPORTANT - THIS SPECIFIC BOT:
- This WhatsApp bot supports 9 countries: Mexico 🇲🇽, Colombia 🇨🇴, Brazil 🇧🇷, Costa Rica 🇨🇷, Uruguay 🇺🇾, Argentina 🇦🇷, Chile 🇨🇱, UK 🇬🇧, Europe 🇪🇺
- Uses Wise API for these transfers
- If asked about other Latin American countries (like Peru, Ecuador, etc.): "This WhatsApp bot only handles these 7 Latin America countries. For other countries, use the main MyBambu app"

NOTE: Knowledge base mentions 13 countries - that's for MyBambu in general (other services). This WhatsApp bot is specific.

- Speak English in a friendly and professional way
- Help with questions about transfers, errors, and processes
- Be brief and clear (2-3 sentences)
- Use general examples from knowledge base, but adapt to this bot's context

To start: "Send $100 to Mexico"`;

    // Build conversation context for the prompt
    let conversationContext = systemPrompt;

    // Add recent conversation history
    if (recentMessages && recentMessages.length > 0) {
      conversationContext += '\n\nRECENT CONVERSATION:\n' + recentMessages.join('\n');
    }

    // Build input array with context and current message
    const inputMessages = [
      {
        role: 'system' as const,
        content: conversationContext
      },
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    // Call OpenAI Prompt API with file search and vector store
    const response = await openai.responses.create({
      prompt: {
        id: PROMPT_ID,
        version: PROMPT_VERSION
      },
      input: inputMessages,
      text: {
        format: {
          type: 'text' as const
        }
      },
      reasoning: {},
      tools: [
        {
          type: 'file_search' as const,
          vector_store_ids: [VECTOR_STORE_ID]
        }
      ],
      max_output_tokens: 2048,
      store: true,
      include: ['web_search_call.action.sources' as any]
    });

    // Extract content from response output
    const firstOutput: any = response.output?.[0];
    let aiResponse: string;

    if (firstOutput && firstOutput.content) {
      const content = firstOutput.content;
      if (typeof content === 'string') {
        aiResponse = content;
      } else if (Array.isArray(content) && content.length > 0) {
        // Handle array of content blocks
        const textContent = content.find((c: any) => c.type === 'text');
        aiResponse = textContent?.text || String(content[0]);
      } else {
        aiResponse = String(content);
      }
    } else {
      aiResponse = language === 'es'
        ? 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?'
        : "Sorry, I couldn't process your message. Can you try again?";
    }

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
  'CRC': { en: 'Costa Rica', es: 'Costa Rica', flag: '🇨🇷' },
  'UYU': { en: 'Uruguay', es: 'Uruguay', flag: '🇺🇾' },
  'ARS': { en: 'Argentina', es: 'Argentina', flag: '🇦🇷' },
  'CLP': { en: 'Chile', es: 'Chile', flag: '🇨🇱' },
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
