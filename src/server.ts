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
  'colombia': { country: 'Colombia', currency: 'COP', deliveryTime: '1-3 business days' },
  'brazil': { country: 'Brazil', currency: 'BRL', deliveryTime: '1-3 business days' },
  'uk': { country: 'United Kingdom', currency: 'GBP', deliveryTime: 'Same day' },
  'united kingdom': { country: 'United Kingdom', currency: 'GBP', deliveryTime: 'Same day' },
  'europe': { country: 'Europe', currency: 'EUR', deliveryTime: '1 business day' }
};

// Exchange rates (demo/fallback)
const EXCHANGE_RATES: Record<string, number> = {
  'MXN': 17.2,
  'COP': 3750,
  'BRL': 5.1,
  'GBP': 0.79,
  'EUR': 0.92
};

// Session management (in-memory for MVP)
interface UserSession {
  step: 'idle' | 'collecting_amount' | 'collecting_country' | 'collecting_recipient' | 'collecting_bank_details' | 'confirming';
  amount?: number;
  country?: string;
  currency?: string;
  recipientName?: string;
  bankDetails?: Record<string, any>;
  lastActivity: Date;
  language?: Language; // Detected user language (es/en)
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
    sessions.set(phoneNumber, { step: 'idle', lastActivity: new Date() });
  }

  const session = sessions.get(phoneNumber)!;
  const now = new Date();

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
    /(\d+(?:\.\d{2})?)\s*(?:dollars|usd|USD)/i,  // 100 dollars
    /send\s+(\d+)/i  // send 100
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
    session.recipientName = undefined;
    session.bankDetails = undefined;
    const message = session.language === 'es'
      ? '🔄 Transferencia cancelada. Escribe "hola" para empezar de nuevo.'
      : '🔄 Transfer cancelled. Say "hello" to start again.';
    await sendWhatsAppMessage(from, message);
    return;
  }

  if (lowerText.includes('help') || lowerText.includes('ayuda')) {
    const message = session.language === 'es'
      ? '💡 *Ayuda de MyBambu*\n\n' +
        'Puedo ayudarte a enviar dinero a:\n' +
        '• México 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brasil 🇧🇷\n' +
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
      ? '👋 *¡Bienvenido a MyBambu!*\n\n' +
        'Te ayudo a enviar dinero internacionalmente con excelentes tasas.\n\n' +
        '🌎 Países disponibles:\n' +
        '• México 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brasil 🇧🇷\n' +
        '• Reino Unido 🇬🇧\n' +
        '• Europa 🇪🇺\n\n' +
        getTransferExamples('es')
      : '👋 *Welcome to MyBambu!*\n\n' +
        'I help you send money internationally with great rates.\n\n' +
        '🌎 Supported countries:\n' +
        '• Mexico 🇲🇽\n' +
        '• Colombia 🇨🇴\n' +
        '• Brazil 🇧🇷\n' +
        '• United Kingdom 🇬🇧\n' +
        '• Europe 🇪🇺\n\n' +
        getTransferExamples('en');
    await sendWhatsAppMessage(from, message);
    return;
  }

  // Check exchange rate
  if (lowerText.includes('rate') || lowerText.includes('exchange')) {
    const country = extractCountry(text);
    if (country) {
      const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
      if (corridor) {
        const rate = EXCHANGE_RATES[corridor.currency];
        await sendWhatsAppMessage(from,
          `💱 *Exchange Rate*\n\n` +
          `1 USD = ${rate} ${corridor.currency}\n\n` +
          `Ready to send? Try "Send $100 to ${country}"`
        );
      }
    } else {
      await sendWhatsAppMessage(from, '🌎 Which country? (Mexico, Colombia, Brazil, UK, or Europe)');
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
    } else if (amount) {
      session.amount = amount;
      session.step = 'collecting_country';
      const message = isSpanish
        ? `✅ Enviando *$${amount} USD*\n\n` +
          `🌎 ¿A qué país?\n` +
          `• México 🇲🇽\n` +
          `• Colombia 🇨🇴\n` +
          `• Brasil 🇧🇷\n` +
          `• Reino Unido 🇬🇧\n` +
          `• Europa 🇪🇺`
        : `✅ Sending *$${amount} USD*\n\n` +
          `🌎 Which country?\n` +
          `• Mexico 🇲🇽\n` +
          `• Colombia 🇨🇴\n` +
          `• Brazil 🇧🇷\n` +
          `• United Kingdom 🇬🇧\n` +
          `• Europe 🇪🇺`;
      await sendWhatsAppMessage(from, message);
    } else {
      session.step = 'collecting_amount';
      const message = isSpanish
        ? '💰 ¿Cuánto quieres enviar? (en USD)\n\n' + getTransferExamples('es')
        : '💰 How much would you like to send? (in USD)\n\n' + getTransferExamples('en');
      await sendWhatsAppMessage(from, message);
    }
    return;
  }

  // AI fallback for unrecognized messages
  try {
    console.log(`🤖 Using AI fallback for: "${text}"`);
    const aiResponse = await callOpenAI(text, {
      userPhone: from,
      language: session.language || 'en',
      sessionStep: session.step,
    });
    await sendWhatsAppMessage(from, aiResponse);
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
  }
}

async function handleCollectingAmount(from: string, text: string, session: UserSession) {
  const amount = extractAmount(text);
  if (amount && amount >= 1 && amount <= 10000) {
    session.amount = amount;
    session.step = 'collecting_country';
    await sendWhatsAppMessage(from,
      `✅ Sending *$${amount} USD*\n\n` +
      `🌎 Which country?\n` +
      `• Mexico\n` +
      `• Colombia\n` +
      `• Brazil\n` +
      `• United Kingdom\n` +
      `• Europe`
    );
  } else {
    await sendWhatsAppMessage(from, '❌ Please enter a valid amount between $1 and $10,000\n\nExample: "$100" or "100"');
  }
}

async function handleCollectingCountry(from: string, text: string, session: UserSession) {
  const country = extractCountry(text);
  if (country) {
    session.country = country;
    const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
    session.currency = corridor?.currency;
    session.step = 'collecting_recipient';

    const rate = EXCHANGE_RATES[session.currency!];
    const estimated = (session.amount! * 0.97 * rate).toFixed(2); // Rough estimate with 3% fee

    await sendWhatsAppMessage(from,
      `✅ Destination: *${country}*\n` +
      `💱 Rate: 1 USD = ${rate} ${session.currency}\n` +
      `📩 They'll receive: ~${estimated} ${session.currency}\n\n` +
      `📝 What's the recipient's full name?`
    );
  } else {
    await sendWhatsAppMessage(from,
      '❌ Please choose a supported country:\n' +
      '• Mexico\n' +
      '• Colombia\n' +
      '• Brazil\n' +
      '• United Kingdom\n' +
      '• Europe'
    );
  }
}

async function handleCollectingRecipient(from: string, text: string, session: UserSession) {
  if (text.trim().length >= 3) {
    session.recipientName = text.trim();
    session.step = 'collecting_bank_details';
    session.bankDetails = {};

    const requirements = getBankRequirements(session.currency!);
    if (requirements) {
      const fieldsText = requirements.fields
        .map(f => `• *${f.label}*: ${f.description}\n  Example: ${f.example}`)
        .join('\n\n');

      await sendWhatsAppMessage(from,
        `✅ Recipient: *${session.recipientName}*\n\n` +
        `📋 Now I need their bank details:\n\n` +
        `${fieldsText}\n\n` +
        `ℹ️ Send them one at a time or all together.`
      );
    } else {
      await sendWhatsAppMessage(from, '❌ Error: Unsupported currency');
      session.step = 'idle';
    }
  } else {
    await sendWhatsAppMessage(from, '❌ Please enter the recipient\'s full name (at least 3 characters)');
  }
}

async function handleCollectingBankDetails(from: string, text: string, session: UserSession) {
  const requirements = getBankRequirements(session.currency!);
  if (!requirements) {
    await sendWhatsAppMessage(from, '❌ Error: Unsupported currency');
    session.step = 'idle';
    return;
  }

  // Parse bank details from message
  const details = session.bankDetails || {};

  // Simple extraction (in production, use better NLP)
  for (const field of requirements.fields) {
    // Check if field name or label appears in text
    // Updated regex to match digits, word chars, spaces, hyphens, and other common characters
    const fieldPattern = new RegExp(`(?:${field.name}|${field.label})\\s*:?\\s*([\\w\\s\\-\\.\\+\\(\\)]+)`, 'i');
    const match = text.match(fieldPattern);
    if (match && !details[field.name]) {
      details[field.name] = match[1].trim();
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

    await sendWhatsAppMessage(from,
      `✅ *Ready to Send!*\n\n` +
      `💰 You send: $${session.amount} USD\n` +
      `💵 Fee: ~$${fee} USD\n` +
      `💱 Rate: ${rate} ${session.currency}/USD\n` +
      `📩 ${session.recipientName} receives: ~${recipientAmount} ${session.currency}\n` +
      `🌎 Country: ${session.country}\n\n` +
      `⏱️ Delivery: ${Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === session.country)?.deliveryTime}\n\n` +
      `Type *"CONFIRM"* to send, or "cancel" to stop.`
    );
  } else {
    const missingText = validation.missingFields.map(f => `• ${f}`).join('\n');
    await sendWhatsAppMessage(from,
      `❌ Still need:\n\n${missingText}\n\n` +
      `Please provide the missing information.`
    );
  }
}

async function handleConfirmation(from: string, text: string, session: UserSession) {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('confirm') || lowerText.includes('yes') || lowerText.includes('send')) {
    await sendWhatsAppMessage(from, '⏳ Processing your transfer...');

    try {
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
            recipientBankCode = details.cpf || '';
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
        }

        const result = await wiseService.sendMoney({
          amount: session.amount!,
          recipientName: session.recipientName!,
          recipientCountry: session.country!,
          recipientBankAccount,
          recipientBankCode,
          targetCurrency: session.currency!,
          reference: `WhatsApp transfer to ${session.recipientName}`,
          ...extraFields
        });

        await sendWhatsAppMessage(from,
          `✅ *Transfer Sent!*\n\n` +
          `💰 Sent: $${result.amount} USD\n` +
          `📩 Receives: ${result.targetAmount.toFixed(2)} ${session.currency}\n` +
          `💱 Rate: ${result.rate.toFixed(4)}\n` +
          `💵 Fee: $${result.fee.toFixed(2)}\n` +
          `⏱️ Delivery: ${result.estimatedDelivery}\n` +
          `🆔 Transfer ID: ${result.transferId}\n\n` +
          `✨ Real transfer via Wise API\n\n` +
          `Say "hello" to send another transfer!`
        );
      } else {
        // Demo mode
        const rate = EXCHANGE_RATES[session.currency!];
        const fee = (session.amount! * 0.03);
        const netAmount = session.amount! - fee;
        const recipientAmount = netAmount * rate;

        await sendWhatsAppMessage(from,
          `✅ *Transfer Demo*\n\n` +
          `💰 Sent: $${session.amount} USD\n` +
          `📩 Receives: ~${recipientAmount.toFixed(2)} ${session.currency}\n` +
          `💱 Rate: ~${rate}\n` +
          `💵 Fee: ~$${fee.toFixed(2)}\n\n` +
          `🎭 This is a DEMO. No real money sent.\n` +
          `Set MODE=PRODUCTION in .env for real transfers.\n\n` +
          `Say "hello" to try another transfer!`
        );
      }

      // Reset session
      session.step = 'idle';
      session.amount = undefined;
      session.country = undefined;
      session.recipientName = undefined;
      session.bankDetails = undefined;

    } catch (error: any) {
      console.error('Transfer error:', error);
      await sendWhatsAppMessage(from,
        `❌ *Transfer Failed*\n\n` +
        `Error: ${error.message}\n\n` +
        `Please try again or contact support.`
      );
      session.step = 'idle';
    }
  } else {
    await sendWhatsAppMessage(from,
      `Type *"CONFIRM"* to proceed with the transfer,\n` +
      `or "cancel" to stop.`
    );
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
