# 🎯 FRESH START - WhatsApp Setup (Correct Order!)

Since you deleted the old account, let's set up the NEW one the RIGHT way.

**KEY:** Deploy server FIRST, then configure WhatsApp. Not the other way around!

---

## 📋 THE CORRECT ORDER

```
1. Deploy server to Railway        ← Get URL first!
2. Create WhatsApp Business Account ← Fresh start
3. Add phone number                 ← Verify with SMS
4. Create/use Developer App         ← Link to business
5. Configure webhook                ← Use Railway URL
6. Test!                            ← Send messages
```

**This order prevents the "can't verify" error!**

---

## 🚀 STEP 1: Deploy Server FIRST (10 minutes)

**Why first?** Because Facebook needs a live server URL to verify the webhook!

### 1.1: Navigate to Project

```bash
cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers
```

### 1.2: Test Locally (optional but recommended)

```bash
# Install dependencies (if not already)
npm install

# Build
npm run build

# Test
npm run dev
```

**Expected output:**
```
🚀 MyBambu WhatsApp Server
📍 Port: 3000
🎭 Mode: DEMO
❌ WhatsApp: Missing TOKEN (this is OK for now!)
✅ Ready for messages!
```

Press Ctrl+C to stop.

### 1.3: Install Railway CLI

```bash
npm install -g @railway/cli
```

### 1.4: Login to Railway

```bash
railway login
```

This opens your browser. Sign up/login with:
- GitHub (recommended)
- Google
- Email

### 1.5: Initialize Railway Project

```bash
railway init
```

**Prompts:**
- Project name: `bambusend-whatsapp`
- Team: (choose your team or personal)

### 1.6: Set Temporary Environment Variables

For now, set placeholder values (we'll update later with real credentials):

```bash
railway variables set WEBHOOK_VERIFY_TOKEN="bambusend_secure_token_2024"
railway variables set WHATSAPP_ACCESS_TOKEN="placeholder"
railway variables set WHATSAPP_PHONE_NUMBER_ID="placeholder"
railway variables set MODE="DEMO"
railway variables set PORT="3000"
railway variables set WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e"
railway variables set WISE_PROFILE_ID="29182377"
railway variables set WISE_API_URL="https://api.sandbox.transferwise.tech"
```

### 1.7: Deploy!

```bash
railway up
```

**Expected:**
```
Building...
✓ Build successful
Deploying...
✓ Deployment successful
```

### 1.8: Get Your Public URL

```bash
railway domain
```

**You'll get something like:**
```
https://bambusend-whatsapp-production.up.railway.app
```

**✅ COPY THIS URL!** You need it for Step 2!

### 1.9: Test Server is Live

```bash
curl https://your-railway-url.railway.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "mode": "DEMO",
  "wiseConnected": false,
  "whatsappConfigured": false
}
```

✅ **If you see this, your server is live and ready!**

---

## 📱 STEP 2: Create NEW WhatsApp Business Account (10 minutes)

Now that you have a live server, let's create your WhatsApp account.

### 2.1: Go to Business Manager

**Open:** https://business.facebook.com

**If you don't have a Business Account:**
1. Click "Create Account"
2. Enter business name: "Bambu Send"
3. Your name
4. Business email
5. Complete setup

### 2.2: Create WhatsApp Business Account

1. In left sidebar, find **"WhatsApp Accounts"** or **"WhatsApp Manager"**
2. Click **"Add"** or **"Create WhatsApp Business Account"**
3. Name: "Bambu Send"
4. Click **"Create"**

**Result:** You now have a NEW WABA (WhatsApp Business Account)

**Copy the WABA ID** (looks like: `123456789012345`)

### 2.3: Add Phone Number

1. In WhatsApp Manager, click **"Add phone number"**
2. Choose: **"Use a phone number you already have"** (or register new)
3. Enter phone number (with country code)
4. Click **"Next"**

**Verification:**
1. Choose: SMS or Voice call
2. Enter verification code
3. ✅ Phone verified!

### 2.4: Configure Business Profile

1. Display name: "Bambu Send"
2. Category: "Financial Services"
3. Description: "Envía dinero a Colombia y México de forma rápida y segura"
4. Profile photo (optional): Upload logo

### 2.5: Get Phone Number ID

**Important! Copy this:**

1. In WhatsApp Manager, click on your phone number
2. Find **"Phone number ID"**
3. Copy it (looks like: `987654321098765`)

**Save this! You need it for Step 4!**

---

## 🛠️ STEP 3: Create/Update Developer App (5 minutes)

### 3.1: Go to Developer Console

**Open:** https://developers.facebook.com/apps

### 3.2: Create New App (or use existing)

**If creating new:**
1. Click **"Create App"**
2. Select **"Business"** type
3. App name: "Bambu Send WhatsApp"
4. Email: Your email
5. **Business Account:** Select the one from Step 2
6. Click **"Create app"**

**If using existing app (ID: 1887037432191884):**
- Just use that one!

### 3.3: Add WhatsApp Product

1. In app dashboard, find **"Add products to your app"**
2. Find **WhatsApp**
3. Click **"Set up"**

### 3.4: Link to Your NEW Business Account

1. Go to **WhatsApp → Configuration**
2. Find **"Business Account"** section
3. Click **"Link business account"**
4. Select your NEW business account from Step 2
5. ✅ Linked!

---

## 🔑 STEP 4: Get Credentials (5 minutes)

### 4.1: Generate Access Token

**Go to:** WhatsApp → API Setup (or "Get Started")

1. Find **"Temporary access token"** section
2. Click **"Generate Token"**
3. **COPY TOKEN** (starts with `EAA...`)

**Save this immediately!** You need it now.

### 4.2: Verify Phone Number ID

Same page, find the phone number dropdown:
```
From: +1 (234) 567-8900 (987654321098765)
```

The number in parentheses is your Phone Number ID (should match Step 2.5).

### 4.3: Update Railway Environment Variables

**NOW update Railway with REAL credentials:**

```bash
railway variables set WHATSAPP_ACCESS_TOKEN="EAA...your_real_token"
railway variables set WHATSAPP_PHONE_NUMBER_ID="987654321098765"
```

### 4.4: Redeploy (to pick up new env vars)

```bash
railway up
```

Or just restart in Railway dashboard.

---

## 🔗 STEP 5: Configure Webhook (5 minutes)

**NOW you can configure the webhook! Your server is live!**

### 5.1: Go to Webhook Configuration

**Open:** Your App → WhatsApp → Configuration

Find **"Webhook"** section.

### 5.2: Click "Edit" or "Configure webhooks"

### 5.3: Enter Details

**Callback URL:**
```
https://your-railway-url.railway.app/webhook
```
(Use YOUR Railway URL from Step 1.8)

**Verify token:**
```
bambusend_secure_token_2024
```
(Must match the `WEBHOOK_VERIFY_TOKEN` you set in Railway)

### 5.4: Click "Verify and Save"

**What happens:**
- Facebook sends GET request to your Railway server
- Your server responds with the challenge
- ✅ Green checkmark appears!

**If verification fails:**
- Check Railway logs: `railway logs`
- Verify token must match exactly
- URL must include `/webhook` at end
- URL must be HTTPS (Railway provides this)

### 5.5: Subscribe to Webhook Fields

After verification, you'll see **"Webhook fields"**.

**Subscribe to:**
- ✅ **messages** (REQUIRED)
- ✅ message_status (optional)

Click **"Subscribe"** for each.

---

## 🧪 STEP 6: Test! (5 minutes)

### 6.1: Add Your Personal Number to Test Recipients

**In Developers Console:**
1. WhatsApp → API Setup
2. Find "Send and receive messages" section
3. Click **"Manage phone number list"**
4. Click **"Add phone number"**
5. Enter YOUR personal WhatsApp number (with country code)
6. Verify it (you'll receive a code on WhatsApp)

### 6.2: Send Test Message from YOUR Phone

From your personal WhatsApp, send to your business number:
```
Hello
```

### 6.3: Check Railway Logs

```bash
railway logs --follow
```

**Expected:**
```
📱 +1234567890 [idle]: Hello
📤 Sent to +1234567890: 👋 Welcome to MyBambu!...
```

### 6.4: Check WhatsApp

You should receive the bot's response! 🎉

### 6.5: Test Full Flow

```
You: Send $100 to Mexico

Bot: ✅ Sending $100 USD to Mexico
     📝 What's the recipient's full name?

You: Maria Garcia

Bot: ✅ Recipient: Maria Garcia
     📋 I need their CLABE number...

You: 032180000118359719

Bot: ✅ Ready to Send!
     Type "CONFIRM" to send

You: CONFIRM

Bot: ✅ Transfer Demo
     This is a demo. No real money sent.
```

✅ **If this works, you're DONE!**

---

## 📊 Verification Checklist

- [ ] Server deployed to Railway ✅
- [ ] Railway URL obtained ✅
- [ ] Health endpoint returns 200 ✅
- [ ] NEW WhatsApp Business Account created ✅
- [ ] Phone number added and verified ✅
- [ ] Phone Number ID copied ✅
- [ ] Developer app created/updated ✅
- [ ] App linked to business account ✅
- [ ] Access token generated ✅
- [ ] Railway env vars updated with real credentials ✅
- [ ] Webhook configured with Railway URL ✅
- [ ] Webhook verified (green checkmark) ✅
- [ ] Subscribed to "messages" field ✅
- [ ] Personal number added to test recipients ✅
- [ ] Sent "Hello" → Received reply ✅
- [ ] Tested full transfer flow ✅

---

## 🎯 Why This Order Works

**OLD way (causes errors):**
```
1. Create WhatsApp account
2. Try to configure webhook
3. ❌ No server running → Can't verify
4. Deploy server later
5. Go back and reconfigure webhook
```

**NEW way (works perfectly):**
```
1. Deploy server FIRST → Have URL ready
2. Create WhatsApp account
3. Configure webhook → Verifies immediately ✅
4. Test!
```

---

## 🆘 Troubleshooting

### Webhook verification fails

**Check:**
```bash
# Test health endpoint
curl https://your-railway-url.railway.app/health

# Test webhook manually
curl "https://your-railway-url.railway.app/webhook?hub.mode=subscribe&hub.verify_token=bambusend_secure_token_2024&hub.challenge=test123"
```

Should return: `test123`

**If not working:**
- Check Railway logs: `railway logs`
- Verify token must match exactly
- Check server is running (no errors in logs)

### Messages not arriving

**Check:**
- Webhook subscribed to "messages"? ✅
- Your number added to test recipients? ✅
- Access token correct in Railway? ✅
- Phone Number ID correct? ✅

### Can't generate token

**Possible issue:** App not properly linked to business account.

**Fix:**
1. Go to App → WhatsApp → Configuration
2. Verify business account is linked
3. Try generating token again

---

## 🎉 Success Criteria

When everything is working:

1. ✅ Railway deployment shows "Active"
2. ✅ Health endpoint returns 200
3. ✅ Webhook has green checkmark in Facebook
4. ✅ Send "Hello" → Bot replies
5. ✅ Complete transfer flow works
6. ✅ Logs show no errors

**You now have a working WhatsApp money transfer bot!** 🚀

---

## 📝 Save These Values

**For future reference:**

```bash
# Railway
Railway URL: https://your-app.railway.app

# Facebook/WhatsApp
Business ID: [your new business ID]
WABA ID: [your new WABA ID]
App ID: [your app ID]
Phone Number ID: [your phone number ID]
Access Token: EAA... [keep secret!]

# Configuration
Webhook Token: bambusend_secure_token_2024
Mode: DEMO
```

---

**Time to complete:** 35-40 minutes total
**Difficulty:** Medium (following order is key!)
**Result:** Working WhatsApp bot! 🎉

**Let's do this! Start with Step 1 (Deploy to Railway)** 🚀
