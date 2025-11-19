# 🚀 WhatsApp MVP Quick Start

Get your WhatsApp money transfer bot running in 10 minutes!

## 📱 What You're Getting

**Working WhatsApp Bot that can:**
- ✅ Send money to 5 countries (Mexico, Colombia, Brazil, UK, Europe)
- ✅ Natural conversation flow
- ✅ Collect bank details automatically
- ✅ Integration with Wise API
- ✅ Demo mode (no real money) + Production mode (real transfers)

**Based on proven Claude Desktop implementation - just adapted for WhatsApp!**

---

## ⚡ Super Quick Start (If you have WhatsApp credentials ready)

### 1. Configure Environment

Edit `.env` file and add your WhatsApp credentials:

```bash
# ADD THESE (from Facebook developers portal):
WHATSAPP_ACCESS_TOKEN=EAA...your_token
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# ALREADY CONFIGURED:
WISE_API_KEY=1624cba2-cdfa-424f-91d8-787a5225d52e
WISE_PROFILE_ID=29182377
MODE=DEMO
```

### 2. Start Server

```bash
npm run dev
```

### 3. Expose with ngrok

**Option A: If ngrok installed:**
```bash
ngrok http 3000
```

**Option B: Manual install ngrok:**
```bash
# Download from: https://ngrok.com/download
# Or try: sudo brew install --cask ngrok
```

**Option C: Use alternative (localtunnel):**
```bash
npx localtunnel --port 3000
```

### 4. Configure Webhook

1. Copy the https URL from ngrok (e.g., `https://abc123.ngrok.io`)
2. Go to: https://developers.facebook.com
3. Your App → WhatsApp → Configuration → Webhooks
4. Callback URL: `https://abc123.ngrok.io/webhook`
5. Verify Token: `mybambu_secret_token_12345`
6. Subscribe to: `messages`
7. Click "Verify and Save"

### 5. Test!

Send WhatsApp message to your business number:
```
Hello
```

You should get a response! 🎉

---

## 🆘 Don't Have WhatsApp Credentials Yet?

### Quick Path: Get Facebook/WhatsApp Setup

**Time: ~15 minutes**

#### Step 1: Business Account (5 min)
1. Go to: https://business.facebook.com
2. Create/login to Business Account
3. WhatsApp Manager → Add Phone Number
4. Verify via SMS
5. **Copy Phone Number ID**

#### Step 2: Developer App (5 min)
1. Go to: https://developers.facebook.com
2. My Apps → Create App → Business
3. Add WhatsApp product
4. Link to your Business Account (from Step 1)

#### Step 3: Get Token (2 min)
1. WhatsApp → API Setup
2. Generate Access Token
3. **Copy the token (EAA...)**

#### Step 4: Test (3 min)
1. In API Setup, send test message
2. Enter YOUR phone number
3. Click Send
4. **Check WhatsApp - should get "Hello World"**

✅ **If test worked, you're ready!** Add credentials to `.env`

**Having issues?** → See [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)

---

## 🎭 Your Current Setup Status

Check what's configured:

```bash
npm run dev
```

Look for:
```
🚀 MyBambu WhatsApp Server
📍 Port: 3000
💬 WhatsApp: ✅ Configured  (or ❌ Missing)
💸 Wise API: ✅ Configured
🎭 Mode: DEMO
```

---

## 🧪 Test Conversation Flow

Once webhook is connected:

### Test 1: Greeting
```
You: Hello
Bot: 👋 Welcome to MyBambu! I help you send money...
```

### Test 2: Check Rate
```
You: What's the rate to Mexico?
Bot: 💱 Exchange Rate: 1 USD = 17.2 MXN
```

### Test 3: Full Transfer (Demo Mode)
```
You: Send $100 to Mexico

Bot: ✅ Sending $100 USD to Mexico
     📝 What's the recipient's full name?

You: Juan Garcia

Bot: ✅ Recipient: Juan Garcia
     📋 I need their bank details:
     • CLABE Number: 18-digit Mexican bank account...

You: 032180000118359719

Bot: ✅ Ready to Send!
     💰 You send: $100 USD
     📩 Receives: ~1,670 MXN
     Type "CONFIRM" to send

You: CONFIRM

Bot: ✅ Transfer Demo
     This is a demo. No real money was sent.
```

✅ **If this works, your MVP is complete!**

---

## 🔧 Troubleshooting Quick Fixes

### Server won't start
```bash
# Check Node version (need 20+)
node --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Webhook verification fails
- Check verify token: `mybambu_secret_token_12345` (exact match!)
- Check ngrok is running
- Check URL has `/webhook` at end
- Check server is running (Terminal 1)

### Messages not arriving
- Check webhook subscribed to "messages"
- Check access token in .env
- Check phone number ID in .env
- Try sending from your personal number

### Bot doesn't respond
- Check server logs (Terminal 1)
- Should see: `📱 +1555... [idle]: Hello`
- If not receiving messages, webhook config issue
- If receiving but not responding, check .env credentials

---

## 🚀 Production Checklist

**Ready for real transfers?**

- [ ] Test full flow in DEMO mode
- [ ] WhatsApp webhook working
- [ ] Wise API credentials configured
- [ ] Tested with small amount first
- [ ] Deployed to Railway/Render (not ngrok)
- [ ] Set `MODE=PRODUCTION` in environment

**Then send real transfer!**

---

## 📚 Full Documentation

- **Detailed Setup:** [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md) - Step-by-step with screenshots
- **Full README:** [README.md](./README.md) - Complete documentation
- **Troubleshooting:** [WHATSAPP-NUMBER-FIX.md](../../WHATSAPP-NUMBER-FIX.md) - Common issues

---

## 💡 Pro Tips

1. **Keep terminals visible:** Terminal 1 (server) + Terminal 2 (ngrok)
2. **Watch server logs:** You'll see all messages and errors
3. **Test in DEMO first:** No real money, perfect for testing
4. **Start with Mexico:** Simplest (just needs CLABE number)
5. **Use test data:** CLABE: `032180000118359719`

---

## ✨ What Makes This Special

**Compared to Claude Desktop:**
- ✅ Simpler (no MCP complexity)
- ✅ More users (2B+ WhatsApp users vs Claude Desktop users)
- ✅ Mobile-first (everyone has WhatsApp)

**Compared to ChatGPT:**
- ✅ No AI moderation bypass needed
- ✅ Full control over flow
- ✅ Simpler webhooks (vs MCP/SSE)

**Reuses proven Wise integration from Claude!**

---

## 🎯 Next Actions

**Right Now:**
1. Add WhatsApp credentials to `.env`
2. Run `npm run dev`
3. Start ngrok
4. Configure webhook in Facebook
5. Send "Hello" via WhatsApp

**Total Time:** 10-15 minutes if credentials ready

**This Week:**
1. Test all 5 countries
2. Deploy to Railway
3. Switch to PRODUCTION mode
4. Process real transfer!

---

## 🆘 Still Stuck?

**Facebook/WhatsApp Setup Issues:**
- "Number already in use" → [WHATSAPP-NUMBER-FIX.md](../../WHATSAPP-NUMBER-FIX.md)
- Can't verify webhook → Check token matches + ngrok running
- No test message → Check phone number ID + access token

**Server Issues:**
- Won't start → `npm install && npm run build`
- No responses → Check `.env` credentials
- Errors in logs → Check which line, usually config issue

**Need to install ngrok manually:**
```bash
# Download from: https://ngrok.com/download
# Or: sudo brew install --cask ngrok
# Or use localtunnel: npx localtunnel --port 3000
```

---

**You're 10 minutes away from a working WhatsApp money transfer bot!** 🚀

Start with: `npm run dev`
