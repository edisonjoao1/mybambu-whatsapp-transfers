# 🚀 Quick Deploy Guide - Your Credentials Ready!

All your credentials are ready. Choose deployment method:

---

## ⚡ Option A: Railway Website (EASIEST)

### Step 1: Go to Railway
**Visit:** https://railway.app/new

### Step 2: Login
Click "Login with GitHub"

### Step 3: Deploy from GitHub
1. Click "Deploy from GitHub repo"
2. Select: **mybambu-whatsapp-transfers**
3. Click "Deploy"

### Step 4: Add Environment Variables
Click on your deployment → "Variables" tab → Add these:

```
WHATSAPP_ACCESS_TOKEN=EAAc7PlLT7ZBABP4maDZCJKvxJNIETbNdg0628j2HIJx4wTPtZBAGT2fAu6VUotY7uriJqfhY2rVBNZBSkoT7nHESfv1SN8z5umtYOLJZBbt8YZAYMY4XumggR8oRDu8mjgOI72ZAb2AQ5ZCljIxqnUYFY7nTTLqzHEAFJ9at8OrFLyjffWyw5FXxXf3dMarJSpso4EPkgL3ZCCBb1zgEOCyb3bYRPpKZCdOJWGtBUsZAGBBawTXaagSC2xWWZAc38R77hwSiS5uA2224qUClxP2cCgZDZD

WHATSAPP_PHONE_NUMBER_ID=826251713912705

WEBHOOK_VERIFY_TOKEN=bambusend_secure_2024

MODE=DEMO

WISE_API_KEY=1624cba2-cdfa-424f-91d8-787a5225d52e

WISE_PROFILE_ID=29182377

WISE_API_URL=https://api.sandbox.transferwise.tech

PORT=3000
```

### Step 5: Get Your URL
- Railway auto-generates URL
- Click "Settings" → "Generate Domain"
- Copy URL: `https://mybambu-whatsapp-production.up.railway.app`

---

## ⚡ Option B: Railway CLI (Terminal)

### Step 1: Login to Railway
```bash
railway login
```

### Step 2: Link to GitHub Repo
```bash
railway link
```
Select: **mybambu-whatsapp-transfers**

### Step 3: Set Variables
```bash
railway variables set WHATSAPP_ACCESS_TOKEN="EAAc7PlLT7ZBABP4maDZCJKvxJNIETbNdg0628j2HIJx4wTPtZBAGT2fAu6VUotY7uriJqfhY2rVBNZBSkoT7nHESfv1SN8z5umtYOLJZBbt8YZAYMY4XumggR8oRDu8mjgOI72ZAb2AQ5ZCljIxqnUYFY7nTTLqzHEAFJ9at8OrFLyjffWyw5FXxXf3dMarJSpso4EPkgL3ZCCBb1zgEOCyb3bYRPpKZCdOJWGtBUsZAGBBawTXaagSC2xWWZAc38R77hwSiS5uA2224qUClxP2cCgZDZD"

railway variables set WHATSAPP_PHONE_NUMBER_ID="826251713912705"

railway variables set WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024"

railway variables set MODE="DEMO"

railway variables set WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e"

railway variables set WISE_PROFILE_ID="29182377"

railway variables set WISE_API_URL="https://api.sandbox.transferwise.tech"

railway variables set PORT="3000"
```

### Step 4: Deploy
```bash
railway up
```

### Step 5: Get Domain
```bash
railway domain
```

---

## 🔗 After Deployment (IMPORTANT!)

### Configure Webhook on Facebook

1. **Go to:** https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/

2. **Find "Webhooks" section** → Click "Configure" or "Edit"

3. **Enter:**
   - **Callback URL:** `https://your-railway-url.railway.app/webhook`
   - **Verify Token:** `bambusend_secure_2024`

4. **Click "Verify and Save"** → Should see ✅ green checkmark

5. **Subscribe to fields:**
   - ✅ Check "messages"
   - Click "Subscribe"

---

## 🧪 Test Your Bot!

### Step 1: Add Your Phone as Test Recipient
1. Go to Facebook WhatsApp API Setup page
2. Scroll to "To" section
3. Click "Add recipient phone number"
4. Enter YOUR phone number
5. Verify with code Meta sends

### Step 2: Message the Bot
1. Open WhatsApp on your phone
2. Start new chat to: **+1 555 159 4893**
3. Send: "Hello"
4. Bot should reply! 🎉

### Step 3: Test Transfer Flow
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

---

## 🆘 Troubleshooting

### Webhook Verification Fails
**Check:**
```bash
railway logs
```
Look for: `✅ Webhook verified!`

**Test manually:**
```bash
curl "https://your-railway-url.railway.app/webhook?hub.mode=subscribe&hub.verify_token=bambusend_secure_2024&hub.challenge=test123"
```
Should return: `test123`

### Messages Not Arriving
**Check:**
1. Webhook subscribed to "messages"? ✅
2. Your phone added as test recipient? ✅
3. Sending to correct number: +1 555 159 4893? ✅

**View logs:**
```bash
railway logs --follow
```

### Health Check
```bash
curl https://your-railway-url.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "mode": "DEMO",
  "wiseConnected": false,
  "whatsappConfigured": true
}
```

---

## 📊 Your Configuration Summary

| Setting | Value |
|---------|-------|
| **Test Phone** | +1 555 159 4893 |
| **Phone Number ID** | 826251713912705 |
| **WABA ID** | 1410914981038542 |
| **Mode** | DEMO (safe testing) |
| **Wise** | Sandbox (no real money) |
| **Valid For** | 90 days (test number) |

---

## ✅ Success Checklist

- [ ] Deployed to Railway
- [ ] Got Railway URL
- [ ] Webhook configured on Facebook
- [ ] Webhook verified (green checkmark)
- [ ] Subscribed to "messages"
- [ ] Added your phone as test recipient
- [ ] Sent "Hello" to +1 555 159 4893
- [ ] Bot replied!
- [ ] Tested transfer flow

**All checked?** You have a working WhatsApp money transfer bot! 🎉

---

**Time:** 10 minutes
**Cost:** FREE (Railway $5 credit, test phone for 90 days)
**GitHub:** https://github.com/edisonjoao1/mybambu-whatsapp-transfers

**Ready to deploy!** 🚀
