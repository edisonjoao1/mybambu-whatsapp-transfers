# 🚀 GET YOUR CREDENTIALS RIGHT NOW

You're almost there! The linking is ALREADY DONE (that's why you see your phone in the dropdown).

---

## ✅ What You Have (Already Working!)

- ✅ Business Account (482336855815272)
- ✅ App created (1887037432191884)
- ✅ Phone number registered
- ✅ Template created ("¡Bienvenido a Bambu Send!")
- ✅ Phone visible in developers console
- ✅ **App and Business ALREADY LINKED!**

The "already in use" is EXPECTED - it means your number is registered!

---

## 🎯 Get Credentials NOW (2 Steps)

### STEP 1: Get Access Token (1 minute)

**Go to this EXACT URL:**
```
https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-dev-console/
```

**On that page:**
1. Scroll down to "Temporary access token" section
2. Click the **"Generate Token"** button
3. A popup appears with token starting with `EAA...`
4. Click **"Copy"** button
5. Paste it somewhere safe (Notes app)

**If you don't see "Generate Token" button:**
- Look for "Access Tokens" section
- Or look for "Step 1: Select phone number and WABA"
- The token might already be visible - just copy it

---

### STEP 2: Get Phone Number ID (1 minute)

**Same page as Step 1:**
```
https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-dev-console/
```

**Find "Send and receive messages" section:**

You'll see something like:
```
From: +1 (234) 567-8900 (123456789012345)
```

The number in parentheses `(123456789012345)` is your **Phone Number ID**.

**Copy that number!**

---

## ✅ You Now Have Everything!

You should have:
1. ✅ Access Token: `EAA...` (long string)
2. ✅ Phone Number ID: `123456789012345` (15 digits)

---

## 🚀 Deploy NOW (10 minutes)

### 1. Update .env file

```bash
cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers

# Open .env in text editor and update:
```

Add these lines (replace with YOUR values):
```bash
WHATSAPP_ACCESS_TOKEN=EAA...paste_your_token_here
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WEBHOOK_VERIFY_TOKEN=bambusend_secure_2024
MODE=DEMO
```

### 2. Deploy to Railway

```bash
# Install Railway CLI (if not already)
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway variables set WHATSAPP_ACCESS_TOKEN="EAA...your_token"
railway variables set WHATSAPP_PHONE_NUMBER_ID="123456789012345"
railway variables set WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024"
railway variables set MODE="DEMO"
railway up

# Get URL
railway domain
```

### 3. Configure Webhook

**Go to:**
```
https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-settings/
```

**Find "Webhook" section, click Edit:**
- Callback URL: `https://your-app.railway.app/webhook`
- Verify Token: `bambusend_secure_2024`
- Subscribe to: `messages` ✅

Click "Verify and Save"

---

## 🧪 Test!

### Test 1: Health Check
```bash
curl https://your-app.railway.app/health
```

Should return: `{"status":"ok",...}`

### Test 2: Send WhatsApp Message

From YOUR phone, send to your business number:
```
Hello
```

Expected response:
```
👋 Welcome to MyBambu!

I help you send money internationally...
```

### Test 3: Full Transfer Flow

```
You: Send $100 to Mexico
Bot: What's the recipient's full name?

You: Maria Garcia
Bot: I need their CLABE number...
```

---

## 🔧 If Test Message from Console Doesn't Work

**That's OK!** You don't need it. The test message feature is just for validation.

**What matters:**
1. ✅ Phone number visible in dropdown (you have this!)
2. ✅ Can generate access token (do this now!)
3. ✅ Deploy to Railway
4. ✅ Configure webhook
5. ✅ Send real WhatsApp message → bot responds

**The webhook is the REAL test.**

---

## 🎯 Your Template Integration (Later)

Your template "¡Bienvenido a Bambu Send!" can be used for:
- Welcome messages
- Re-engagement (after 24h window)
- Marketing messages

**For now:** Focus on getting basic messages working first!

**Later:** Add template support in code:
```typescript
await axios.post(url, {
  messaging_product: 'whatsapp',
  to: phoneNumber,
  type: 'template',
  template: {
    name: 'bienvenido_a_bambu_send',
    language: { code: 'es' }
  }
});
```

---

## ✅ CHECKLIST

Before deploying:
- [ ] Got Access Token from developers console
- [ ] Got Phone Number ID from same page
- [ ] Updated .env file with both values
- [ ] Installed Railway CLI
- [ ] Logged into Railway
- [ ] Set environment variables in Railway
- [ ] Deployed: `railway up`
- [ ] Got Railway URL: `railway domain`
- [ ] Configured webhook in Facebook
- [ ] Webhook verified (green checkmark)

After deploying:
- [ ] Sent "Hello" to business number
- [ ] Received welcome message back
- [ ] Tried "Send $100 to Mexico"
- [ ] Bot guided through flow

---

## 🆘 Quick Fixes

### "Can't find Generate Token button"
Look for these sections on the API Setup page:
- "Temporary access token"
- "Get started"
- "Step 1: Select phone number"

The token might be visible without clicking - just copy it!

### "Can't find Phone Number ID"
Check the dropdown in "Send and receive messages" section. The format is:
```
From: +X (XXX) XXX-XXXX (PHONE_NUMBER_ID_HERE)
```

### "Already in use" error
**IGNORE IT!** This is normal. It just means the number is registered. You can still use it!

---

## 🎉 You're 2 Minutes Away!

1. Go get those 2 values (token + phone ID)
2. Update .env
3. Deploy to Railway
4. Test!

**Let's do this!** 🚀
