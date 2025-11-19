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

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'my_verify_token';
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WISE_API_KEY = process.env.WISE_API_KEY || '';
const WISE_PROFILE_ID = process.env.WISE_PROFILE_ID || '';
const WISE_API_URL = process.env.WISE_API_URL || 'https://api.sandbox.transferwise.tech';
const MODE = process.env.MODE || 'DEMO';

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
}

const sessions = new Map<string, UserSession>();

function getSession(phoneNumber: string): UserSession {
  if (!sessions.has(phoneNumber)) {
    sessions.set(phoneNumber, { step: 'idle', lastActivity: new Date() });
  }
  const session = sessions.get(phoneNumber)!;
  session.lastActivity = new Date();
  return session;
}

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
  for (const [key, value] of Object.entries(TRANSFER_CORRIDORS)) {
    if (lowerText.includes(key)) {
      return value.country;
    }
  }
  return null;
}

// Message handlers
async function handleIncomingMessage(from: string, text: string) {
  const session = getSession(from);
  const lowerText = text.toLowerCase();

  console.log(`📱 ${from} [${session.step}]: ${text}`);

  // Global commands
  if (lowerText.includes('cancel') || lowerText.includes('stop') || lowerText.includes('reset')) {
    session.step = 'idle';
    session.amount = undefined;
    session.country = undefined;
    session.recipientName = undefined;
    session.bankDetails = undefined;
    await sendWhatsAppMessage(from, '🔄 Transfer cancelled. Say "hello" to start again.');
    return;
  }

  if (lowerText.includes('help')) {
    await sendWhatsAppMessage(from,
      '💡 *MyBambu Help*\n\n' +
      'I can help you send money to:\n' +
      '• Mexico\n' +
      '• Colombia\n' +
      '• Brazil\n' +
      '• United Kingdom\n' +
      '• Europe\n\n' +
      'Try:\n' +
      '• "Send $100 to Mexico"\n' +
      '• "What\'s the rate to Colombia?"\n' +
      '• "Send money to my family"\n\n' +
      'Say "cancel" anytime to stop.'
    );
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

  // Greeting
  if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
    await sendWhatsAppMessage(from,
      '👋 *Welcome to MyBambu!*\n\n' +
      'I help you send money internationally with great rates.\n\n' +
      '🌎 Supported countries:\n' +
      '• Mexico\n' +
      '• Colombia\n' +
      '• Brazil\n' +
      '• United Kingdom\n' +
      '• Europe\n\n' +
      'Try: "Send $100 to Mexico"'
    );
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

  // Send money intent
  if (lowerText.includes('send')) {
    const amount = extractAmount(text);
    const country = extractCountry(text);

    if (amount && country) {
      session.amount = amount;
      session.country = country;
      const corridor = Object.values(TRANSFER_CORRIDORS).find((c: any) => c.country === country);
      session.currency = corridor?.currency;
      session.step = 'collecting_recipient';

      await sendWhatsAppMessage(from,
        `✅ Got it! Sending *$${amount} USD* to *${country}*\n\n` +
        `📝 What's the recipient's full name?`
      );
    } else if (amount) {
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
      session.step = 'collecting_amount';
      await sendWhatsAppMessage(from, '💰 How much would you like to send? (in USD)');
    }
    return;
  }

  // Default fallback
  await sendWhatsAppMessage(from,
    '👋 I can help you send money internationally!\n\n' +
    'Try:\n' +
    '• "Send $100 to Mexico"\n' +
    '• "Check rate to Colombia"\n' +
    '• "Help"'
  );
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
    const fieldPattern = new RegExp(`(?:${field.name}|${field.label})\\s*:?\\s*([\\w\\s\\-]+)`, 'i');
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

// Start server
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
