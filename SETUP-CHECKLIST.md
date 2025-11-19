# ✅ WhatsApp Setup Checklist

Follow this step-by-step to get your WhatsApp money transfer bot running.

## 📋 Prerequisites

- [ ] Node.js 20+ installed
- [ ] npm installed
- [ ] Text editor
- [ ] Personal WhatsApp number for testing

---

## 🔧 Step 1: Local Setup (5 minutes)

### 1.1 Install Dependencies

```bash
cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers
npm install
```

✅ **Expected:** "added 98 packages"

### 1.2 Build Project

```bash
npm run build
```

✅ **Expected:** No errors, `dist/` folder created

### 1.3 Test Server

```bash
npm run dev
```

✅ **Expected:**
```
🚀 MyBambu WhatsApp Server
📍 Port: 3000
🎭 Mode: DEMO
❌ WhatsApp: Missing TOKEN
✅ Ready for messages!
```

**Press Ctrl+C to stop** (we'll run it again later)

---

## 📱 Step 2: WhatsApp Business Setup (15-20 minutes)

### 2.1 Create Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create Business Account (or use existing)
3. Click **WhatsApp Manager** in left sidebar
4. Click **Add Phone Number**
5. Choose: Register new number OR use existing
6. Verify via SMS code
7. ✅ **Copy the Phone Number ID** (looks like: `123456789012345`)

### 2.2 Create Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps** → **Create App**
3. Choose **Business** type
4. App Name: "MyBambu WhatsApp" (or your choice)
5. Click **Create App**

### 2.3 Add WhatsApp Product

1. In your new app dashboard
2. Find **WhatsApp** product
3. Click **Set Up**
4. In Configuration → Click **Link Business Account**
5. Select your WhatsApp Business Account from Step 2.1

### 2.4 Generate Access Token

1. Go to **WhatsApp** → **API Setup**
2. Find your phone number in dropdown
3. Click **Generate Token**
4. Copy the token (starts with `EAA...`)
5. ✅ **Save this token** - you'll need it in .env

### 2.5 Send Test Message

1. Still in **API Setup** page
2. Find "Send test message" section
3. In "To:" field, enter YOUR personal phone number (with country code, e.g., +15551234567)
4. Click **Send message**
5. ✅ **Check your WhatsApp** - should receive "Hello World"

**If you received the test message, WhatsApp API is working!** 🎉

---

## 🔐 Step 3: Configure Environment Variables (2 minutes)

Edit `.env` file in `whatsapp-transfers/` folder:

```bash
# WhatsApp Business API Configuration
WEBHOOK_VERIFY_TOKEN=mybambu_secret_token_12345  # ✅ Already set (don't change)
WHATSAPP_ACCESS_TOKEN=EAA...  # ← Paste token from Step 2.4
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # ← Paste from Step 2.1

# Wise API Configuration (already configured for sandbox)
WISE_API_KEY=1624cba2-cdfa-424f-91d8-787a5225d52e
WISE_PROFILE_ID=29182377
WISE_API_URL=https://api.sandbox.transferwise.tech

# Server Configuration
PORT=3000
MODE=DEMO  # Start with DEMO, switch to PRODUCTION later
```

**Save the file!**

---

## 🌐 Step 4: Expose Server with ngrok (5 minutes)

### 4.1 Install ngrok

**Mac (using Homebrew):**
```bash
brew install ngrok
```

**Or download:** [ngrok.com/download](https://ngrok.com/download)

### 4.2 Start Your Server

Terminal 1:
```bash
cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers
npm run dev
```

✅ **Expected:**
```
🚀 MyBambu WhatsApp Server
📍 Port: 3000
✅ WhatsApp: Configured
✅ Wise API: Configured
🎭 Mode: DEMO
```

### 4.3 Start ngrok

Terminal 2 (new terminal):
```bash
ngrok http 3000
```

✅ **Expected:**
```
Forwarding    https://abc123def.ngrok.io -> http://localhost:3000
```

**✅ Copy the https URL** (e.g., `https://abc123def.ngrok.io`)

**Keep both terminals running!**

---

## 🔗 Step 5: Configure Webhook in Facebook (5 minutes)

1. Go back to [developers.facebook.com](https://developers.facebook.com)
2. Your App → **WhatsApp** → **Configuration**
3. Find "Webhook" section
4. Click **Edit** or **Configure Webhooks**

### 5.1 Enter Webhook Details

**Callback URL:**
```
https://abc123def.ngrok.io/webhook
```
(Replace with YOUR ngrok URL from Step 4.3)

**Verify Token:**
```
mybambu_secret_token_12345
```
(Must match `WEBHOOK_VERIFY_TOKEN` in your .env)

### 5.2 Subscribe to Events

Check these boxes:
- ✅ **messages**

### 5.3 Click "Verify and Save"

✅ **Expected:** Green checkmark, "Webhook verified"

**If verification fails:**
- Check both terminals are running
- Verify ngrok URL is correct (with /webhook at end)
- Verify token matches exactly
- Check server logs for errors

---

## 🎉 Step 6: Test It! (5 minutes)

### 6.1 Send WhatsApp Message

From YOUR personal phone, send a WhatsApp message to your business number:

```
Hello
```

### 6.2 Check Server Logs

In Terminal 1 (where server is running), you should see:

```
📱 +15551234567 [idle]: Hello
📤 Sent to +15551234567: 👋 Welcome to MyBambu!...
```

### 6.3 Check Your Phone

You should receive a response from the bot!

### 6.4 Test Full Flow

Try:
```
Send $100 to Mexico
```

The bot will guide you through:
1. ✅ Confirm amount and country
2. ✅ Ask for recipient name
3. ✅ Ask for CLABE number
4. ✅ Show transfer summary
5. ✅ Confirm to process

Type: `CONFIRM`

✅ **Expected:** Demo transfer confirmation (no real money sent in DEMO mode)

---

## 🎭 Demo vs Production Mode

### Current: DEMO Mode
- ✅ No real money sent
- ✅ Simulated transfers
- ✅ Perfect for testing

### Switch to PRODUCTION Mode

When ready for real transfers:

1. Edit `.env`:
   ```bash
   MODE=PRODUCTION
   ```

2. Restart server (Ctrl+C, then `npm run dev`)

3. Send transfer - **REAL money will be sent!**

---

## 🐛 Troubleshooting

### Issue: Webhook verification fails

**Check:**
- [ ] Both terminals running (server + ngrok)?
- [ ] ngrok URL is HTTPS?
- [ ] /webhook added to end of URL?
- [ ] Verify token matches .env exactly?

**Fix:** Check Terminal 1 for errors

### Issue: No messages arriving

**Check:**
- [ ] Subscribed to "messages" in webhook config?
- [ ] Access token correct in .env?
- [ ] Phone number ID correct?
- [ ] Sent from your verified personal number?

**Fix:** Check both terminal logs

### Issue: Bot doesn't respond

**Check:**
- [ ] Server running without errors?
- [ ] Check server logs - do you see "📱 +..." line?
- [ ] WhatsApp credentials configured?

**Fix:** Restart server, check .env

### Issue: "Transfer failed"

**In DEMO mode:**
- Should never fail (it's simulated)

**In PRODUCTION mode:**
- Check Wise API credentials
- Check recipient bank details are correct
- Check server logs for Wise API errors

---

## ✅ Success Checklist

- [ ] Server running on port 3000
- [ ] ngrok exposing server with https URL
- [ ] Webhook verified in Facebook (green checkmark)
- [ ] Received "Hello" response from bot
- [ ] Completed test transfer in DEMO mode
- [ ] Bot conversation feels natural

**If all checked, you're done! 🎉**

---

## 🚀 Next Steps

### 1. Production Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Add env vars in Railway dashboard
# Update webhook URL in Facebook to Railway URL
```

### 2. Production Mode

- Set `MODE=PRODUCTION` in Railway env vars
- Test with small amount first
- Monitor Wise sandbox transfers

### 3. Enhancements

- [ ] Add interactive buttons
- [ ] Multi-language support
- [ ] Transfer history
- [ ] Rate alerts
- [ ] Better NLP for bank details

---

## 📞 Support

**Stuck?**
1. Check logs in Terminal 1 (server)
2. Check [WHATSAPP-NUMBER-FIX.md](../../WHATSAPP-NUMBER-FIX.md)
3. Check [WHATSAPP-INTEGRATION-PLAN.md](../../WHATSAPP-INTEGRATION-PLAN.md)
4. Review [README.md](./README.md)

**Common Issues Solved:**
- Webhook verification: Check verify token matches
- No messages: Check webhook subscriptions
- No response: Check server logs for errors
- Number issues: See WHATSAPP-NUMBER-FIX.md

---

**Built with ❤️ by MyBambu**

**Time to complete:** ~30-40 minutes
**Difficulty:** Medium (Facebook setup is tricky, code is easy)
**Result:** Working WhatsApp money transfer bot! 🚀
