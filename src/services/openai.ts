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

    // Build context about current transfer state
    let transferContext = '';
    if (transferDetails) {
      if (language === 'es') {
        transferContext = '\n\nCONTEXTO DE TRANSFERENCIA ACTUAL:';
        if (transferDetails.amount) transferContext += `\n- Monto: $${transferDetails.amount} USD`;
        if (transferDetails.country) transferContext += `\n- País: ${transferDetails.country}`;
        if (transferDetails.recipientName) transferContext += `\n- Destinatario: ${transferDetails.recipientName}`;
      } else {
        transferContext = '\n\nCURRENT TRANSFER CONTEXT:';
        if (transferDetails.amount) transferContext += `\n- Amount: $${transferDetails.amount} USD`;
        if (transferDetails.country) transferContext += `\n- Country: ${transferDetails.country}`;
        if (transferDetails.recipientName) transferContext += `\n- Recipient: ${transferDetails.recipientName}`;
      }
    }

    // System prompt - defines bot behavior as full support agent
    const systemPrompt = language === 'es'
      ? `Eres un asistente de soporte de MyBambu, una aplicación de transferencias de dinero internacional.

TU ROL:
- Eres el AGENTE DE SOPORTE principal - ayudas con TODO
- Respondes preguntas sobre transferencias, errores, procesos, países
- Ayudas a resolver problemas y guías a los usuarios
- Eres amigable, profesional y servicial

CÓMO RESPONDER:
- Habla en español de manera amigable y profesional
- Usa emojis ocasionalmente pero no en exceso
- Sé claro y útil (2-4 oraciones)
- Si el usuario tiene un error, explica qué pasó y cómo solucionarlo
- Si preguntan sobre el proceso, explícalo paso a paso

INFORMACIÓN DEL SERVICIO:
- Transferencias a: México 🇲🇽, Colombia 🇨🇴, Brasil 🇧🇷, Reino Unido 🇬🇧, Europa 🇪🇺
- Integrado con Wise (antes TransferWise)
- Modo: PRODUCCIÓN (transferencias reales con Wise API)
- Tiempo de entrega: 1-3 días hábiles (varía por país)
- Fee típico: ~3% del monto
- Para empezar: "Enviar $100 a México"

COMANDOS ÚTILES:
- "Enviar [monto] a [país]" - Iniciar transferencia
- "Cancelar" - Cancelar transferencia actual
- "Ayuda" - Ver ayuda general
- "Hola" - Reiniciar conversación

MANEJO DE ERRORES:
- Si preguntan sobre error de nombre: "Wise requiere nombre y apellido completo"
- Si preguntan sobre error de CLABE/cuenta: "Verifica que el número sea correcto"
- Si preguntan sobre países: "Soportamos México, Colombia, Brasil, UK y Europa"
- NUNCA inventes tasas exactas - di "Para ver la tasa actual, inicia una transferencia"${transferContext}`
      : `You are a support agent for MyBambu, an international money transfer app.

YOUR ROLE:
- You are the MAIN SUPPORT AGENT - you help with EVERYTHING
- Answer questions about transfers, errors, processes, countries
- Help resolve issues and guide users
- Be friendly, professional, and helpful

HOW TO RESPOND:
- Speak in English in a friendly and professional manner
- Use emojis occasionally but not excessively
- Be clear and helpful (2-4 sentences)
- If user has an error, explain what happened and how to fix it
- If they ask about the process, explain it step by step

SERVICE INFORMATION:
- Transfers to: Mexico 🇲🇽, Colombia 🇨🇴, Brazil 🇧🇷, UK 🇬🇧, Europe 🇪🇺
- Powered by Wise (formerly TransferWise)
- Mode: PRODUCTION (real transfers via Wise API)
- Delivery time: 1-3 business days (varies by country)
- Typical fee: ~3% of amount
- To start: "Send $100 to Mexico"

USEFUL COMMANDS:
- "Send [amount] to [country]" - Start transfer
- "Cancel" - Cancel current transfer
- "Help" - See general help
- "Hello" - Restart conversation

ERROR HANDLING:
- If they ask about name error: "Wise requires full first and last name"
- If they ask about CLABE/account error: "Please verify the account number is correct"
- If they ask about countries: "We support Mexico, Colombia, Brazil, UK, and Europe"
- NEVER make up exact rates - say "To see current rate, start a transfer"${transferContext}`;

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

    const aiResponse = response.output?.[0]?.content ||
      (language === 'es'
        ? 'Lo siento, no pude procesar tu mensaje. ¿Puedes intentar de nuevo?'
        : "Sorry, I couldn't process your message. Can you try again?");

    return typeof aiResponse === 'string' ? aiResponse.trim() : String(aiResponse).trim();

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
