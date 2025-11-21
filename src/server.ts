#!/usr/bin/env node

/**
 * MyBambu WhatsApp Money Transfer Server
 *
 * Conversational money transfers via WhatsApp Business API
 * Reuses Wise service from Claude Desktop implementation
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { initializeWiseService, getWiseService } from './services/wise.js';
import { getBankRequirements, validateBankDetails } from './services/recipient-fields.js';
import {
  callOpenAI,
  detectLanguage,
  getTransferExamples,
  getCountryName,
  getCountryFlag,
  type Language
} from './services/openai.js';
import {
  storeVerificationCode,
  canRequestVerification,
  recordVerificationSent,
  verifyCode,
  getVerificationStatus,
  formatVerificationMessageEnglish,
  formatVerificationMessageSpanish
} from './services/verification.js';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '1mb' })); // Prevent DOS attacks

// Configuration with validation
const MODE = process.env.MODE || 'DEMO';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Required environment variables
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;
if (!VERIFY_TOKEN) {
  console.error('❌ FATAL: WEBHOOK_VERIFY_TOKEN environment variable is required');
  process.exit(1);
}

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WISE_API_KEY = process.env.WISE_API_KEY || '';
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID || '';
const WISE_API_URL = process.env.WISE_API_URL || 'https://api.sandbox.transferwise.tech';

// Transfer corridors (same as Claude implementation)
const TRANSFER_CORRIDORS: Record<string, any> = {
  'mexico': { country: 'Mexico', currency: 'MXN', deliveryTime: '1-2 business days' },
  'méxico': { country: 'Mexico', currency: 'MXN', deliveryTime: '1-2 business days' },
  'colombia': { country: 'Colombia', currency: 'COP', deliveryTime: '1-3 business days' },
  'brazil': { country: 'Brazil', currency: 'BRL', deliveryTime: '1-3 business days' },
  'brasil': { country: 'Brazil', currency: 'BRL', deliveryTime: '1-3 business days' },
  'costa rica': { country: 'Costa Rica', currency: 'CRC', deliveryTime: '1-3 business days' },
  'uruguay': { country: 'Uruguay', currency: 'UYU', deliveryTime: '1-3 business days' },
  'chile': { country: 'Chile', currency: 'CLP', deliveryTime: '1-3 business days' },
  'uk': { country: 'United Kingdom', currency: 'GBP', deliveryTime: 'Same day' },
  'united kingdom': { country: 'United Kingdom', currency: 'GBP', deliveryTime: 'Same day' },
  'reino unido': { country: 'United Kingdom', currency: 'GBP', deliveryTime: 'Same day' },
  'europe': { country: 'Europe', currency: 'EUR', deliveryTime: '1 business day' },
  'europa': { country: 'Europe', currency: 'EUR', deliveryTime: '1 business day' }
};

// Exchange rates (demo/fallback)
const EXCHANGE_RATES: Record<string, number> = {
  'MXN': 17.2,
  'COP': 3750,
  'BRL': 5.1,
  'CRC': 520,
  'UYU': 42,
  'CLP': 950,
  'GBP': 0.79,
  'EUR': 0.92
};

// Session management (in-memory for MVP)
interface ConversationMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface UserSession {
  step: 'idle' | 'collecting_amount' | 'collecting_country' | 'collecting_recipient' | 'collecting_bank_details' | 'confirming';
  amount?: number;
  country?: string;
  currency?: string;
  recipientName?: string;
  bankDetails?: Record<string, any>;
  lastActivity: Date;
  language?: Language; // Detected user language (es/en)
  conversationHistory: ConversationMessage[]; // Last 5 messages
}

const sessions = new Map<string, UserSession>();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

// Rate limiting
const messageRateLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_MESSAGES_PER_MINUTE = 10;

function checkRateLimit(phoneNumber: string): boolean {
  const now = Date.now();
  let entry = messageRateLimits.get(phoneNumber);

  if (!entry || now > entry.resetTime) {
    messageRateLimits.set(phoneNumber, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (entry.count >= MAX_MESSAGES_PER_MINUTE) {
    console.warn(`⚠️ Rate limit exceeded for ${phoneNumber}`);
    return false;
  }

  entry.count++;
  return true;
}

function getSession(phoneNumber: string): UserSession {
  if (!sessions.has(phoneNumber)) {
    sessions.set(phoneNumber, { step: 'idle', lastActivity: new Date(), conversationHistory: [] });
  }

  const session = sessions.get(phoneNumber)!;
  const now = new Date();

  // Ensure conversationHistory exists (for backwards compatibility)
  if (!session.conversationHistory) {
    session.conversationHistory = [];
  }

  // Reset session if inactive for too long
  if (now.getTime() - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
    console.log(`⏰ Session timeout for ${phoneNumber}, resetting`);
    session.step = 'idle';
    session.amount = undefined;
    session.country = undefined;
    session.currency = undefined;
    session.recipientName = undefined;
    session.bankDetails = undefined;
  }

  session.lastActivity = now;
  return session;
}

// Conversation history helpers
function addToConversationHistory(session: UserSession, role: 'user' | 'bot', text: string) {
  session.conversationHistory.push({
    role,
    text,
    timestamp: new Date()
  });

  // Keep only last 5 messages
  if (session.conversationHistory.length > 5) {
    session.conversationHistory.shift();
  }
}

function getConversationContext(session: UserSession): string {
  return session.conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
    .join('\n');
}

// Context-aware extraction: Check recent messages for missing info
function extractFromContext(session: UserSession, field: 'amount' | 'country'): any {
  // Look at recent user messages for the missing field
  const recentMessages = session.conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-3) // Last 3 user messages
    .map(msg => msg.text)
    .join(' ');

  if (field === 'amount' && !session.amount) {
    return extractAmount(recentMessages);
  } else if (field === 'country' && !session.country) {
    return extractCountry(recentMessages);
  }

  return null;
}

// Cleanup old sessions periodically to prevent memory leak
setInterval(() => {
  const now = new Date();
  let cleaned = 0;

  for (const [phone, session] of sessions.entries()) {
    const inactiveMinutes = (now.getTime() - session.lastActivity.getTime()) / 1000 / 60;
    if (inactiveMinutes > 1440) { // 24 hours
      sessions.delete(phone);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🗑️ Cleaned ${cleaned} inactive sessions (total: ${sessions.size})`);
  }
}, SESSION_CLEANUP_INTERVAL_MS);

// Initialize Wise service if credentials available
if (MODE === 'PRODUCTION' && WISE_API_KEY && WISE_PROFILE_ID) {
  initializeWiseService({
    apiKey: WISE_API_KEY,
    profileId: WISE_PROFILE_ID,
    apiUrl: WISE_API_URL
  });
  console.log('✅ Wise service initialized (PRODUCTION mode)');
} else {
  console.log('🎭 Running in DEMO mode');
}

// WhatsApp Cloud API helper
async function sendWhatsAppMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.log('⚠️  WhatsApp credentials missing. Message:', message);
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  try {
    await axios.post(url, {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log(`📤 Sent to ${to}: ${message.substring(0, 50)}...`);
  } catch (error: any) {
    console.error('❌ WhatsApp send error:', error.response?.data || error.message);
  }
}

// Intent detection helpers
function extractAmount(text: string): number | null {
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)/,  // $100 or $100.00
    /(\d+(?:\.\d{2})?)\s*(?:dollars|usd|USD|dólares|dolares)/i,  // 100 dollars
    /(?:send|enviar|transferir|mandar)\s+\$?(\d+(?:\.\d{2})?)/i,  // send/enviar 100
    /\$?(\d+(?:\.\d{2})?)\s+(?:to|a|para)\s+/i,  // 100 to Colombia / 100 a Colombia
    /^\s*(\d+(?:\.\d{2})?)\s*$/  // Just a number: "100" or "10"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return null;
}

function extractCountry(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Check Spanish country names first
  if (lowerText.includes('méxico') || lowerText.includes('mexico')) {
    return 'Mexico';
  }
  if (lowerText.includes('brasil')) {
    return 'Brazil';
  }
  if (lowerText.includes('reino unido')) {
    return 'United Kingdom';
  }

  // Check English names
  for (const [key, value] of Object.entries(TRANSFER_CORRIDORS)) {
    if (lowerText.includes(key)) {
      return value.country;
    }
  }
  return null;
}

// Message handlers
async function handleIncomingMessage(from: string, text: string) {
  // Rate limiting check
  if (!checkRateLimit(from)) {
    console.warn(`🚫 Rate limit exceeded for ${from}`);
    return; // Silently ignore - don't notify attacker
  }

  const session = getSession(from);
  const lowerText = text.toLowerCase();

  // Track user message in conversation history
  addToConversationHistory(session, 'user', text);

  // Detect language if not set
  if (!session.language) {
    session.language = detectLanguage(text);
    console.log(`🌐 Language detected for ${from}: ${session.language}`);
  }

  console.log(`📱 ${from} [${session.step}] [${session.language}]: ${text}`);

  // Global commands
  if (lowerText.includes('cancel') || lowerText.includes('stop') || lowerText.includes('reset') ||
      lowerText.includes('cancelar') || lowerText.includes('parar')) {
    session.step = 'idle';
    session.amount = undefined;
    session.country = undefined;
    session.currency = undefined;
    session.recipientName = undefined;
    session.bankDetails = undefined;
    const message = session.language === 'es'
      ? '🔄 Transferencia cancelada. Escribe "hola" para empezar de nuevo.'
      : '🔄 Transfer cancelled. Say "hello" to start again.';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
    return;
  }

  if (lowerText.includes('help') || lowerText.includes('ayuda')) {
    const message = session.language === 'es'
      ? '💡 *Ayuda de MyBambu*\n\n' +
        'Puedo ayudarte a enviar dinero a:\n' +
        '• México 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brasil 🇧🇷\n' +
        '• Costa Rica 🇨🇷\n' +
        '• Uruguay 🇺🇾\n' +
        '• Chile 🇨🇱\n' +
        '• Reino Unido 🇬🇧\n' +
        '• Europa 🇪🇺\n\n' +
        'Prueba:\n' +
        '• "Enviar $100 a México"\n' +
        '• "¿Cuál es la tasa para Colombia?"\n' +
        '• "Enviar dinero a mi familia"\n\n' +
        'Escribe "cancelar" en cualquier momento.'
      : '💡 *MyBambu Help*\n\n' +
        'I can help you send money to:\n' +
        '• Mexico 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brazil 🇧🇷\n' +
        '• United Kingdom 🇬🇧\n' +
        '• Europe 🇪🇺\n\n' +
        'Try:\n' +
        '• "Send $100 to Mexico"\n' +
        '• "What\'s the rate to Colombia?"\n' +
        '• "Send money to my family"\n\n' +
        'Say "cancel" anytime to stop.';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
    return;
  }

  // State machine
  switch (session.step) {
    case 'idle':
      await handleIdleState(from, text, session);
      break;

    case 'collecting_amount':
      await handleCollectingAmount(from, text, session);
      break;

    case 'collecting_country':
      await handleCollectingCountry(from, text, session);
      break;

    case 'collecting_recipient':
      await handleCollectingRecipient(from, text, session);
      break;

    case 'collecting_bank_details':
      await handleCollectingBankDetails(from, text, session);
      break;

    case 'confirming':
      await handleConfirmation(from, text, session);
      break;
  }
}

async function handleIdleState(from: string, text: string, session: UserSession) {
  const lowerText = text.toLowerCase();
  const isSpanish = session.language === 'es';

  // Greeting
  if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey') ||
      lowerText.includes('hola') || lowerText.includes('buenos') || lowerText.includes('buenas')) {
    const message = isSpanish
      ? '👋 *¡Hola! Bienvenido a MyBambu*\n\n' +
        'Envía dinero a tus seres queridos con las mejores tasas del mercado. Rápido, seguro y fácil.\n\n' +
        '🌎 *Enviamos a 8 países:*\n' +
        '• México 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brasil 🇧🇷\n' +
        '• Costa Rica 🇨🇷\n' +
        '• Uruguay 🇺🇾\n' +
        '• Chile 🇨🇱\n' +
        '• Reino Unido 🇬🇧\n' +
        '• Europa 🇪🇺\n\n' +
        '💬 *¿Quieres enviar dinero hoy?*\n\n' +
        'Solo dime algo como:\n' +
        '• "Enviar $100 a México"\n' +
        '• "Quiero enviar dinero a Colombia"\n' +
        '• "Transferir a mi familia"\n\n' +
        '¡Empecemos! 🚀'
      : '👋 *Hi! Welcome to MyBambu*\n\n' +
        'Send money to your loved ones with the best rates on the market. Fast, secure, and easy.\n\n' +
        '🌎 *We send to 8 countries:*\n' +
        '• Mexico 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brazil 🇧🇷\n' +
        '• Costa Rica 🇨🇷\n' +
        '• Uruguay 🇺🇾\n' +
        '• Chile 🇨🇱\n' +
        '• United Kingdom 🇬🇧\n' +
        '• Europe 🇪🇺\n\n' +
        '💬 *Want to send money today?*\n\n' +
        'Just tell me something like:\n' +
        '• "Send $100 to Mexico"\n' +
        '• "I want to send money to Colombia"\n' +
        '• "Transfer to my family"\n\n' +
        'Let\'s get started! 🚀';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
    return;
  }

  // Check exchange rate
  if (lowerText.includes('rate') || lowerText.includes('exchange')) {
    const country = extractCountry(text);
    if (country) {
      const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
      if (corridor) {
        const rate = EXCHANGE_RATES[corridor.currency];
        const message = `💱 *Exchange Rate*\n\n` +
          `1 USD = ${rate} ${corridor.currency}\n\n` +
          `Ready to send? Try "Send $100 to ${country}"`;
        await sendWhatsAppMessage(from, message);
        addToConversationHistory(session, 'bot', message);
      }
    } else {
      const message = '🌎 Which country? (Mexico, Colombia, Brazil, UK, or Europe)';
      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
    }
    return;
  }

  // Send money intent (English and Spanish)
  if (lowerText.includes('send') || lowerText.includes('enviar') ||
      lowerText.includes('transferir') || lowerText.includes('mandar')) {
    const amount = extractAmount(text);
    const country = extractCountry(text);

    if (amount && country) {
      session.amount = amount;
      session.country = country;
      const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
      session.currency = corridor?.currency;
      session.step = 'collecting_recipient';

      const flag = getCountryFlag(session.currency || '');
      const message = isSpanish
        ? `✅ ¡Entendido! Enviando *$${amount} USD* a *${country}* ${flag}\n\n` +
          `📝 ¿Cuál es el nombre completo del destinatario?`
        : `✅ Got it! Sending *$${amount} USD* to *${country}* ${flag}\n\n` +
          `📝 What's the recipient's full name?`;

      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
    } else if (amount) {
      session.amount = amount;
      session.step = 'collecting_country';
      const message = isSpanish
        ? `✅ Enviando *$${amount} USD*\n\n` +
          `🌎 ¿A qué país?\n` +
          `• México 🇲🇽\n` +
          `• Colombia 🇨🇴\n` +
          `• Brasil 🇧🇷\n` +
          `• Costa Rica 🇨🇷\n` +
          `• Uruguay 🇺🇾\n` +
          `• Chile 🇨🇱\n` +
          `• Reino Unido 🇬🇧\n` +
          `• Europa 🇪🇺`
        : `✅ Sending *$${amount} USD*\n\n` +
          `🌎 Which country?\n` +
          `• Mexico 🇲🇽\n` +
          `• Colombia 🇨🇴\n` +
          `• Brazil 🇧🇷\n` +
          `• Costa Rica 🇨🇷\n` +
          `• Uruguay 🇺🇾\n` +
          `• Chile 🇨🇱\n` +
          `• United Kingdom 🇬🇧\n` +
          `• Europe 🇪🇺`;
      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
    } else {
      session.step = 'collecting_amount';
      const message = isSpanish
        ? '💰 ¿Cuánto quieres enviar? (en USD)\n\n' + getTransferExamples('es')
        : '💰 How much would you like to send? (in USD)\n\n' + getTransferExamples('en');
      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
    }
    return;
  }

  // AI fallback for unrecognized messages
  try {
    console.log(`🤖 Using AI support for: "${text}"`);

    // Get recent messages for context
    const recentMessages = session.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.text}`)
      .slice(-4); // Last 4 messages for AI context

    // Pass current transfer state to AI
    const transferDetails = {
      amount: session.amount,
      country: session.country,
      currency: session.currency,
      recipientName: session.recipientName,
      bankDetails: session.bankDetails
    };

    const aiResponse = await callOpenAI(text, {
      userPhone: from,
      language: session.language || 'en',
      sessionStep: session.step,
      recentMessages: recentMessages,
      transferDetails: transferDetails
    });
    await sendWhatsAppMessage(from, aiResponse);
    addToConversationHistory(session, 'bot', aiResponse);
  } catch (error) {
    console.error('❌ AI fallback failed:', error);
    // Final fallback
    const message = isSpanish
      ? '👋 ¡Puedo ayudarte a enviar dinero internacionalmente!\n\n' +
        'Prueba:\n' +
        '• "Enviar $100 a México"\n' +
        '• "Tasa para Colombia"\n' +
        '• "Ayuda"'
      : '👋 I can help you send money internationally!\n\n' +
        'Try:\n' +
        '• "Send $100 to Mexico"\n' +
        '• "Check rate to Colombia"\n' +
        '• "Help"';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  }
}

async function handleCollectingAmount(from: string, text: string, session: UserSession) {
  const amount = extractAmount(text);
  const isSpanish = session.language === 'es';

  if (amount && amount >= 1 && amount <= 10000) {
    session.amount = amount;
    session.step = 'collecting_country';
    const message = isSpanish
      ? `✅ Enviando *$${amount} USD*\n\n` +
        `🌎 ¿A qué país?\n` +
        `• México 🇲🇽\n` +
        `• Colombia 🇨🇴\n` +
        `• Brasil 🇧🇷\n` +
        `• Costa Rica 🇨🇷\n` +
        `• Uruguay 🇺🇾\n` +
        `• Chile 🇨🇱\n` +
        `• Reino Unido 🇬🇧\n` +
        `• Europa 🇪🇺`
      : `✅ Sending *$${amount} USD*\n\n` +
        `🌎 Which country?\n` +
        `• Mexico 🇲🇽\n` +
        `• Colombia 🇨🇴\n` +
        `• Brazil 🇧🇷\n` +
        `• Costa Rica 🇨🇷\n` +
        `• Uruguay 🇺🇾\n` +
        `• Chile 🇨🇱\n` +
        `• United Kingdom 🇬🇧\n` +
        `• Europe 🇪🇺`;
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  } else {
    const message = isSpanish
      ? '❌ Por favor ingresa una cantidad válida entre $1 y $10,000\n\nEjemplo: "$100" o "100"'
      : '❌ Please enter a valid amount between $1 and $10,000\n\nExample: "$100" or "100"';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  }
}

async function handleCollectingCountry(from: string, text: string, session: UserSession) {
  let country = extractCountry(text);

  // Try extracting from conversation context if not found
  if (!country) {
    country = extractFromContext(session, 'country');
  }

  if (country) {
    session.country = country;
    const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
    session.currency = corridor?.currency;
    session.step = 'collecting_recipient';

    const rate = EXCHANGE_RATES[session.currency!];
    const estimated = (session.amount! * 0.97 * rate).toFixed(2); // Rough estimate with 3% fee

    const message = `✅ Destination: *${country}*\n` +
      `💱 Rate: 1 USD = ${rate} ${session.currency}\n` +
      `📩 They'll receive: ~${estimated} ${session.currency}\n\n` +
      `📝 What's the recipient's full name?`;
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  } else {
    const message = '❌ Please choose a supported country:\n' +
      '• Mexico\n' +
      '• Colombia\n' +
      '• Brazil\n' +
      '• United Kingdom\n' +
      '• Europe';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  }
}

async function handleCollectingRecipient(from: string, text: string, session: UserSession) {
  const isSpanish = session.language === 'es';
  const name = text.trim();

  // Validate name has at least 2 words (first + last name) for Wise API
  const nameParts = name.split(/\s+/).filter(part => part.length > 0);

  if (nameParts.length >= 2 && name.length >= 3) {
    session.recipientName = name;
    session.step = 'collecting_bank_details';
    session.bankDetails = {};

    const requirements = getBankRequirements(session.currency!);
    if (requirements) {
      const fieldsText = requirements.fields
        .map(f => `• *${f.label}*: ${f.description}\n  Example: ${f.example}`)
        .join('\n\n');

      const message = isSpanish
        ? `✅ Destinatario: *${session.recipientName}*\n\n` +
          `📋 Ahora necesito sus datos bancarios:\n\n` +
          `${fieldsText}\n\n` +
          `ℹ️ Envíalos uno por uno o todos juntos.`
        : `✅ Recipient: *${session.recipientName}*\n\n` +
          `📋 Now I need their bank details:\n\n` +
          `${fieldsText}\n\n` +
          `ℹ️ Send them one at a time or all together.`;

      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
    } else {
      const message = isSpanish
        ? '❌ Error: Moneda no soportada'
        : '❌ Error: Unsupported currency';
      await sendWhatsAppMessage(from, message);
      addToConversationHistory(session, 'bot', message);
      session.step = 'idle';
    }
  } else {
    const message = isSpanish
      ? '❌ Por favor ingresa el nombre completo del destinatario (nombre y apellido)\n\nEjemplo: "Juan Pérez" o "María García"'
      : '❌ Please enter the recipient\'s full name (first and last name)\n\nExample: "John Smith" or "Jane Doe"';
    await sendWhatsAppMessage(from, message);
    addToConversationHistory(session, 'bot', message);
  }
}

async function handleCollectingBankDetails(from: string, text: string, session: UserSession) {
  const requirements = getBankRequirements(session.currency!);
  if (!requirements) {
    await sendWhatsAppMessage(from, '❌ Error: Unsupported currency');
    addToConversationHistory(session, 'bot', '❌ Error: Unsupported currency');
    session.step = 'idle';
    return;
  }

  // Parse bank details from message
  const details = session.bankDetails || {};

  // Build comprehensive field patterns including aliases
  for (const field of requirements.fields) {
    // Skip if already captured
    if (details[field.name]) continue;

    // Build list of all possible field identifiers (name, label, and aliases)
    const identifiers = [field.name, field.label];
    if (field.aliases) {
      identifiers.push(...field.aliases);
    }

    // Try each identifier
    for (const identifier of identifiers) {
      // Escape special regex characters in identifier
      const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Match pattern: "Field name: value" where value stops at:
      // - A dash followed by a word character (like " - C" or "-C")
      // - A comma followed by a word character (like ", P")
      // - A newline
      // - End of string
      // This preserves internal hyphens (like "45-47") but stops at field separators
      const fieldPattern = new RegExp(
        `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s*[-,]\\s*[A-Za-z]|\\n|$)`,
        'i'
      );

      const match = text.match(fieldPattern);
      if (match) {
        // Clean the captured value:
        // 1. Trim all whitespace
        // 2. Remove trailing dashes and spaces
        // 3. Remove trailing punctuation
        let value = match[1].trim();
        value = value.replace(/[\s\-,;]+$/, ''); // Remove trailing spaces, dashes, and punctuation
        value = value.trim(); // Final trim after cleanup

        if (value) {
          details[field.name] = value;
          console.log(`✅ Extracted ${field.name}: "${value}" (matched on "${identifier}")`);
          break; // Found a match, move to next field
        }
      }
    }
  }

  // Also try to extract standalone values (e.g., just "032180000118359719" for CLABE)
  if (requirements.currency === 'MXN' && !details.clabe) {
    const clabeMatch = text.match(/(\d{18})/);
    if (clabeMatch) details.clabe = clabeMatch[1];
  }

  session.bankDetails = details;

  // Validate
  const validation = validateBankDetails(session.currency!, details);

  if (validation.valid) {
    session.step = 'confirming';

    const rate = EXCHANGE_RATES[session.currency!];
    const fee = (session.amount! * 0.03).toFixed(2);
    const netAmount = session.amount! - parseFloat(fee);
    const recipientAmount = (netAmount * rate).toFixed(2);

    const confirmationMessage = `✅ *Ready to Send!*\n\n` +
      `💰 You send: $${session.amount} USD\n` +
      `💵 Fee: ~$${fee} USD\n` +
      `💱 Rate: ${rate} ${session.currency}/USD\n` +
      `📩 ${session.recipientName} receives: ~${recipientAmount} ${session.currency}\n` +
      `🌎 Country: ${session.country}\n\n` +
      `⏱️ Delivery: ${Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === session.country)?.deliveryTime}\n\n` +
      `Type *"CONFIRM"* to send, or "cancel" to stop.`;
    await sendWhatsAppMessage(from, confirmationMessage);
    addToConversationHistory(session, 'bot', confirmationMessage);
  } else {
    const missingText = validation.missingFields.map(f => `• ${f}`).join('\n');
    const missingFieldsMessage = `❌ Still need:\n\n${missingText}\n\n` +
      `Please provide the missing information.`;
    await sendWhatsAppMessage(from, missingFieldsMessage);
    addToConversationHistory(session, 'bot', missingFieldsMessage);
  }
}

async function handleConfirmation(from: string, text: string, session: UserSession) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('confirm') || lowerText.includes('yes') || lowerText.includes('send')) {
    await sendWhatsAppMessage(from, '⏳ Processing your transfer...');
    addToConversationHistory(session, 'bot', '⏳ Processing your transfer...');

    try{
      // Process transfer
      const useRealAPI = MODE === 'PRODUCTION' && WISE_API_KEY;

      if (useRealAPI) {
        const wiseService = getWiseService();

        // Extract bank details for Wise API
        let recipientBankAccount = '';
        let recipientBankCode = '';
        let extraFields: any = {};

        const details = session.bankDetails!;

        switch (session.currency) {
          case 'MXN':
            recipientBankAccount = details.clabe || '';
            break;
          case 'GBP':
            recipientBankAccount = details.accountNumber || '';
            recipientBankCode = details.sortCode || '';
            break;
          case 'BRL':
            recipientBankAccount = details.accountNumber || '';
            extraFields = {
              cpf: details.cpf,
              accountType: details.accountType || 'checking',
              bankCode: details.bankCode || '001'
            };
            break;
          case 'EUR':
            recipientBankAccount = details.iban || '';
            break;
          case 'COP':
            recipientBankAccount = details.accountNumber || '';
            extraFields = {
              accountType: details.accountType || 'SAVINGS',
              phoneNumber: details.phoneNumber,
              idDocumentNumber: details.idDocumentNumber,
              address: details.address,
              city: details.city,
              postCode: details.postCode
            };
            break;
          case 'CRC': // Costa Rica
            recipientBankAccount = details.IBAN || '';
            extraFields = {
              IBAN: details.IBAN,
              idDocumentType: details.idDocumentType || 'NATIONAL_ID_CARD',
              idDocumentNumber: details.idDocumentNumber,
              address: details.address,
              city: details.city,
              postCode: details.postCode
            };
            break;
          case 'UYU': // Uruguay
            recipientBankAccount = details.accountNumber || '';
            extraFields = {
              accountType: details.accountType || 'CHECKING',
              idDocumentType: details.idDocumentType || 'NATIONAL_ID',
              idDocumentNumber: details.idDocumentNumber,
              bankCode: details.bankCode,
              address: details.address,
              city: details.city,
              postCode: details.postCode
            };
            break;
          case 'CLP': // Chile
            recipientBankAccount = details.accountNumber || '';
            extraFields = {
              bankCode: details.bankCode,
              rut: details.rut,
              accountType: details.accountType || 'CHECKING',
              phoneNumber: details.phoneNumber,
              address: details.address,
              city: details.city,
              postCode: details.postCode
            };
            break;
        }

        const result = await wiseService.sendMoney({
          amount: session.amount!,
          recipientName: session.recipientName!,
          recipientCountry: session.country!,
          recipientBankAccount,
          recipientBankCode,
          targetCurrency: session.currency!,
          reference: 'Transfer',
          ...extraFields
        });

        const successMessage = `✅ *Transfer Created!*\n\n` +
          `💰 Sent: $${result.amount} USD\n` +
          `📩 Receives: ${result.targetAmount?.toFixed(2) || 'Processing'} ${session.currency}\n` +
          `💱 Rate: ${result.rate?.toFixed(4) || 'N/A'}\n` +
          `💵 Fee: $${result.fee?.toFixed(2) || 'N/A'}\n` +
          `🆔 Transfer ID: ${result.transferId}\n` +
          `📊 Status: ${result.status}\n\n` +
          `✨ Transfer created successfully via Wise API!\n` +
          `${result.status === 'incoming_payment_waiting' ? '⏳ Awaiting funding (sandbox limitation)\n' : ''}` +
          `Say "hello" to send another transfer!`;
        await sendWhatsAppMessage(from, successMessage);
        addToConversationHistory(session, 'bot', successMessage);
      } else {
        // Demo mode
        const rate = EXCHANGE_RATES[session.currency!];
        const fee = (session.amount! * 0.03);
        const netAmount = session.amount! - fee;
        const recipientAmount = netAmount * rate;

        const demoMessage = `✅ *Transfer Demo*\n\n` +
          `💰 Sent: $${session.amount} USD\n` +
          `📩 Receives: ~${recipientAmount.toFixed(2)} ${session.currency}\n` +
          `💱 Rate: ~${rate}\n` +
          `💵 Fee: ~$${fee.toFixed(2)}\n\n` +
          `🎭 This is a DEMO. No real money sent.\n` +
          `Set MODE=PRODUCTION in .env for real transfers.\n\n` +
          `Say "hello" to try another transfer!`;
        await sendWhatsAppMessage(from, demoMessage);
        addToConversationHistory(session, 'bot', demoMessage);
      }

      // Reset session
      session.step = 'idle';
      session.amount = undefined;
      session.country = undefined;
      session.currency = undefined;
      session.recipientName = undefined;
      session.bankDetails = undefined;

    } catch (error: any) {
      console.error('Transfer error:', error);
      const errorMessage = `❌ *Transfer Failed*\n\n` +
        `Error: ${error.message}\n\n` +
        `Please try again or contact support.`;
      await sendWhatsAppMessage(from, errorMessage);
      addToConversationHistory(session, 'bot', errorMessage);
      session.step = 'idle';
    }
  } else {
    const invalidMessage = `Type *"CONFIRM"* to proceed with the transfer,\n` +
      `or "cancel" to stop.`;
    await sendWhatsAppMessage(from, invalidMessage);
    addToConversationHistory(session, 'bot', invalidMessage);
  }
}

// Webhook verification (required by Meta)
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('🔍 Webhook verification attempt:', { mode, token: token === VERIFY_TOKEN ? '✅' : '❌' });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified!');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Webhook for incoming messages
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Respond immediately (Meta requires 200 within 20 seconds)
    res.sendStatus(200);

    // Process message async
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const from = message.from;
      const text = message.text?.body;

      if (text) {
        await handleIncomingMessage(from, text);
      }
    }
  } catch (error) {
    console.error('❌ Webhook error:', error);
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    mode: MODE,
    wiseConnected: MODE === 'PRODUCTION' && !!WISE_API_KEY,
    whatsappConfigured: !!WHATSAPP_TOKEN && !!PHONE_NUMBER_ID
  });
});

// ============================================================================
// PHONE VERIFICATION API ENDPOINTS
// ============================================================================

/**
 * POST /api/send-verification
 * Send a verification code to a phone number via WhatsApp
 */
app.post('/api/send-verification', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, language = 'en' } = req.body;

    // Validate phone number
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Check rate limiting (verification service will normalize phone internally)
    const rateCheck = canRequestVerification(phoneNumber);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateCheck.reason,
        retryAfter: rateCheck.retryAfter
      });
    }

    // Generate and store verification code
    const verification = storeVerificationCode(phoneNumber);

    // Format message based on language
    const message = language === 'es'
      ? formatVerificationMessageSpanish(verification.code)
      : formatVerificationMessageEnglish(verification.code);

    // Send via WhatsApp (use normalized phone from verification)
    await sendWhatsAppMessage(verification.phoneNumber, message);

    // Record that code was sent (for rate limiting)
    recordVerificationSent(phoneNumber);

    console.log(`✅ Verification code sent to ${verification.phoneNumber}`);

    res.json({
      success: true,
      message: 'Verification code sent',
      expiresIn: 600 // 10 minutes in seconds
    });

  } catch (error: any) {
    console.error('❌ Verification send error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
});

/**
 * POST /api/verify-code
 * Verify a code for a phone number
 */
app.post('/api/verify-code', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code } = req.body;

    // Validate inputs
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required'
      });
    }

    // Verify the code (verification service will normalize phone internally)
    const result = verifyCode(phoneNumber, code);

    if (result.valid) {
      // Don't log here - verification service already logs it
      return res.json({
        success: true,
        message: 'Phone number verified successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.reason,
        attemptsLeft: result.attemptsLeft
      });
    }

  } catch (error: any) {
    console.error('❌ Verification error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code'
    });
  }
});

/**
 * GET /api/verification-status/:phoneNumber
 * Check verification status for a phone number
 */
app.get('/api/verification-status/:phoneNumber', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.params;
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    const status = getVerificationStatus(normalizedPhone);

    res.json({
      success: true,
      ...status
    });

  } catch (error: any) {
    console.error('❌ Status check error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check verification status'
    });
  }
});

/**
 * POST /api/resend-verification
 * Resend verification code (alias for send-verification with better naming)
 */
app.post('/api/resend-verification', async (req: Request, res: Response) => {
  // Reuse the send-verification logic
  return app._router.handle(
    { ...req, url: '/api/send-verification', path: '/api/send-verification' } as any,
    res,
    () => {}
  );
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server (only in non-serverless environment)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('🚀 MyBambu WhatsApp Server');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🎭 Mode: ${MODE}`);
    console.log(`💬 WhatsApp: ${WHATSAPP_TOKEN ? '✅ Configured' : '❌ Missing TOKEN'}`);
    console.log(`📞 Phone ID: ${PHONE_NUMBER_ID ? '✅ Configured' : '❌ Missing ID'}`);
    console.log(`💸 Wise API: ${WISE_API_KEY ? '✅ Configured' : '❌ Missing KEY'}`);
    console.log(`🌐 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log(`✅ Ready for messages!`);
  });
}

// Export for Vercel serverless
export default app;
