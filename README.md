# 📱 MyBambu WhatsApp Transfers

Send money internationally through natural WhatsApp conversations powered by Wise API.

## 🎯 Overview

This is the WhatsApp implementation of MyBambu conversational money transfers. Users can send money to 5 countries through natural WhatsApp conversations:

- 🇲🇽 Mexico (MXN)
- 🇨🇴 Colombia (COP)
- 🇧🇷 Brazil (BRL)
- 🇬🇧 United Kingdom (GBP)
- 🇪🇺 Europe (EUR)

## 🏗️ Architecture

```
User → WhatsApp → Meta Webhook → Your Server → Wise API → Transfer Completed
```

**Key Features:**
- Conversational flow with session management
- Real-time exchange rates
- Country-specific bank detail collection
- Demo mode for testing without real transfers
- Production mode with real Wise API integration

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20+
- WhatsApp Business Account
- Facebook Developer Account
- Wise API credentials (for production)
- ngrok (for local testing)

### 2. Installation

```bash
cd repos/whatsapp-transfers
npm install
```

### 3. Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# WhatsApp Business API
WEBHOOK_VERIFY_TOKEN=your_random_secret_here
WHATSAPP_ACCESS_TOKEN=your_facebook_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_id_here

# Wise API
WISE_API_KEY=your_wise_api_key
WISE_PROFILE_ID=your_wise_profile_id
WISE_API_URL=https://api.sandbox.transferwise.tech

# Server
PORT=3000
MODE=DEMO  # or PRODUCTION for real transfers
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Expose with ngrok

In another terminal:

```bash
ngrok http 3000
```

Copy the https URL (e.g., `https://abc123.ngrok.io`)

### 6. Configure WhatsApp Webhook

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Your App → WhatsApp → Configuration
3. Click "Configure Webhooks"
4. Callback URL: `https://abc123.ngrok.io/webhook`
5. Verify Token: (same as `WEBHOOK_VERIFY_TOKEN` in .env)
6. Subscribe to: `messages`
7. Click "Verify and Save"

## 📱 Usage

Send a WhatsApp message to your business number:

```
You: Hello
Bot: 👋 Welcome to MyBambu!
     I help you send money internationally...

You: Send $100 to Mexico
Bot: ✅ Sending $100 USD to Mexico
     📝 What's the recipient's full name?

You: Juan Garcia
Bot: ✅ Recipient: Juan Garcia
     📋 Now I need their bank details:
     • CLABE Number: 18-digit Mexican bank account...

You: 032180000118359719
Bot: ✅ Ready to Send!
     💰 You send: $100 USD
     📩 Juan Garcia receives: ~1,670 MXN
     Type "CONFIRM" to send

You: CONFIRM
Bot: ✅ Transfer Sent!
     🆔 Transfer ID: 12345
```

## 🔧 WhatsApp Business Setup

### Step 1: Create Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create Business Account
3. WhatsApp Manager → Add Phone Number
4. Verify via SMS
5. Note the **Phone Number ID**

### Step 2: Create Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. My Apps → Create App → Business
3. Add WhatsApp product
4. Configuration → Link Business Account
5. Select your WhatsApp Business Account from Step 1

### Step 3: Generate Access Token

1. developers.facebook.com → Your App → WhatsApp → API Setup
2. Click "Generate Token" next to your phone number
3. Copy the token (starts with `EAA...`)
4. Save to `.env` as `WHATSAPP_ACCESS_TOKEN`

### Step 4: Test

1. In API Setup page, find "Send test message"
2. Enter YOUR personal phone number
3. Click "Send message"
4. Check your WhatsApp - should receive "Hello World"

If this works, you're ready to configure webhooks!

## 🐛 Troubleshooting

### "Webhook verification failed"

✅ **Fix:**
- Ensure `WEBHOOK_VERIFY_TOKEN` in `.env` matches token in Facebook dashboard
- Make sure your server is running
- Check that ngrok URL is correct and accessible
- Must return the `challenge` string exactly as received

### "Messages not arriving"

✅ **Fix:**
- Check webhook is subscribed to `messages` field
- Verify access token is correct
- Check server logs - WhatsApp sends POST within seconds
- Must respond with 200 status within 20 seconds

### "Can't send messages"

✅ **Fix:**
- Verify `WHATSAPP_ACCESS_TOKEN` is correct
- Check `PHONE_NUMBER_ID` matches your registered number
- Ensure access token has `whatsapp_business_messaging` permission
- Test with API tool in developers.facebook.com first

### "Number already in use"

✅ **Fix:**
1. **Option A (Easiest):** business.facebook.com → Business Settings → System Users → Link your app
2. **Option B (Nuclear):** Delete number in WhatsApp Manager, wait 5 min, re-add to your app

## 🎭 Demo vs Production Mode

### Demo Mode (Default)
- Uses hardcoded exchange rates
- Simulates transfers
- No real money sent
- Perfect for testing flow

Set `MODE=DEMO` in `.env`

### Production Mode
- Real Wise API calls
- Real transfers
- Requires valid Wise credentials
- Real money is sent

Set `MODE=PRODUCTION` in `.env`

## 📊 Session Management

The server maintains conversation state per phone number:

```typescript
{
  step: 'idle' | 'collecting_amount' | 'collecting_country' | ...
  amount?: number
  country?: string
  recipientName?: string
  bankDetails?: Record<string, any>
}
```

Sessions are in-memory (for MVP). For production, use Redis.

## 🌍 Supported Countries

| Country | Currency | Required Fields |
|---------|----------|-----------------|
| Mexico | MXN | CLABE (18 digits) |
| Colombia | COP | Account number, Cédula, phone, address |
| Brazil | BRL | CPF, account number, bank code |
| UK | GBP | Sort code (6), account number (8) |
| Europe | EUR | IBAN |

## 🔐 Security Notes

- Never commit `.env` file
- Keep `WEBHOOK_VERIFY_TOKEN` secret
- Rotate `WHATSAPP_ACCESS_TOKEN` regularly
- Use HTTPS in production (ngrok provides this)
- Validate all user input
- Sanitize bank details before sending to Wise

## 🚀 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables in Railway dashboard
railway variables set WEBHOOK_VERIFY_TOKEN=xxx
railway variables set WHATSAPP_ACCESS_TOKEN=xxx
railway variables set WHATSAPP_PHONE_NUMBER_ID=xxx
railway variables set WISE_API_KEY=xxx
railway variables set WISE_PROFILE_ID=xxx
railway variables set MODE=PRODUCTION

# Deploy
railway up

# Get public URL
railway domain
```

Update webhook URL in Facebook to: `https://your-app.railway.app/webhook`

### Render

Create `render.yaml` (or use UI):

```yaml
services:
  - type: web
    name: mybambu-whatsapp
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: WEBHOOK_VERIFY_TOKEN
        sync: false
      - key: WHATSAPP_ACCESS_TOKEN
        sync: false
      - key: WHATSAPP_PHONE_NUMBER_ID
        sync: false
      - key: WISE_API_KEY
        sync: false
      - key: WISE_PROFILE_ID
        sync: false
      - key: MODE
        value: PRODUCTION
```

## 📈 Next Steps

**MVP Complete:**
- [x] Webhook verification
- [x] Message handling
- [x] Conversational flow
- [x] Bank detail collection
- [x] Wise API integration
- [x] Session management

**Future Enhancements:**
- [ ] Interactive buttons (WhatsApp supports them!)
- [ ] Transfer history per user
- [ ] Rate alerts
- [ ] Multi-language support
- [ ] Redis for session persistence
- [ ] Better NLP for bank detail extraction
- [ ] Receipt images/PDFs
- [ ] Transfer status tracking

## 🏆 Comparison with Other Platforms

| Feature | Claude Desktop | ChatGPT | WhatsApp |
|---------|---------------|---------|----------|
| **Complexity** | High (MCP) | High (MCP/SSE) | Low (Webhooks) ✅ |
| **Setup** | Easy | Medium | Hard (Facebook) |
| **Control** | Full | Limited | Full ✅ |
| **Reach** | Claude users | ChatGPT Plus | 2B+ users ✅ |
| **Moderation** | None | High | None ✅ |

## 📝 Development

```bash
# Install dependencies
npm install

# Run in dev mode (hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type check
npm run lint
```

## 🔗 Related

- [Claude Desktop Implementation](../conversational-transfers)
- [ChatGPT Implementation](../chatgpt-transfers)
- [WhatsApp Integration Plan](../../WHATSAPP-INTEGRATION-PLAN.md)
- [Wise API Documentation](https://api-docs.wise.com)

## 📄 License

MIT

## 🆘 Support

Issues? Check:
1. [WHATSAPP-NUMBER-FIX.md](../../WHATSAPP-NUMBER-FIX.md)
2. [WHATSAPP-INTEGRATION-PLAN.md](../../WHATSAPP-INTEGRATION-PLAN.md)
3. Server logs (`console.log` output)
4. WhatsApp webhook logs in Facebook dashboard

---

**Built with ❤️ by MyBambu**

🚀 Ready to revolutionize international money transfers!
