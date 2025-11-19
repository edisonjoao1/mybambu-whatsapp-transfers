# ✅ Facebook/WhatsApp Setup - Verified Against Official Docs

**Based on official Facebook documentation analysis**

Your setup URLs:
- **App:** https://developers.facebook.com/apps/1887037432191884
- **WhatsApp Manager:** https://business.facebook.com/latest/whatsapp_manager/overview/?business_id=482336855815272&asset_id=1882325359327958
- **Use Case:** WHATSAPP_BUSINESS_MESSAGING

---

## 🎯 Your Current Status

### What You Have:
✅ Facebook Developer Account
✅ Business Account (ID: 482336855815272)
✅ WhatsApp Business App created (ID: 1887037432191884)
✅ WhatsApp Business Account (WABA ID: 1882325359327958)
✅ Use Case configured: WHATSAPP_BUSINESS_MESSAGING

### What You Need:
🔲 Access Token (temporary or permanent)
🔲 Phone Number ID
🔲 Webhook configured and verified
🔲 Subscribed to webhook events

---

## 📱 Get Your Credentials (5 minutes)

### 1. Get Access Token

**Temporary Token (24 hours - for testing):**
1. Go to: https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-dev-console/
2. Find "Temporary access token" section
3. Click **Generate Token**
4. Copy token (starts with `EAA...`)
5. Save as `WHATSAPP_ACCESS_TOKEN`

**OR Permanent Token (production):**
1. Go to: https://business.facebook.com/settings/system-users/482336855815272
2. Click **Add** → Create system user
3. Assign app + WhatsApp account permissions
4. Generate token with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy and save immediately

### 2. Get Phone Number ID

**Location 1: API Setup Page**
1. Go to: https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-dev-console/
2. Find "Send and receive messages" section
3. See phone number dropdown
4. The number in parentheses is your Phone Number ID
5. Example: `From: +1234567890 (123456789012345)` ← This number

**Location 2: WhatsApp Manager**
1. Go to: https://business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=482336855815272&waba_id=1882325359327958
2. Click on your phone number
3. Find "Phone number ID" field
4. Copy the ID

**Save as:** `WHATSAPP_PHONE_NUMBER_ID`

---

## 🔗 Configure Webhook (10 minutes)

### Prerequisites:
- [ ] Railway deployment complete (see `DEPLOY-RAILWAY.md`)
- [ ] Have your Railway URL: `https://your-app.railway.app`
- [ ] Generated a secure verify token: `openssl rand -base64 32`

### Steps:

1. **Go to Configuration Page:**
   https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-settings/

2. **Find "Webhook" Section**
   - Should see "Configure webhooks" or "Edit" button

3. **Click Edit/Configure**

4. **Enter Details:**
   ```
   Callback URL: https://your-app.railway.app/webhook
   Verify token: your_secure_random_token
   ```

5. **Important Notes:**
   - URL MUST be HTTPS
   - URL MUST include `/webhook` at end
   - Token MUST match your `WEBHOOK_VERIFY_TOKEN` env var
   - Case-sensitive, no spaces

6. **Click "Verify and Save"**
   - Facebook sends GET request
   - Your server responds with challenge
   - ✅ Green checkmark = success

7. **Subscribe to Events:**
   - Find "Webhook fields" section
   - Click **Subscribe** for:
     - ✅ **messages** (REQUIRED)
     - ✅ message_status (optional)
     - ✅ errors (optional)

---

## 🧪 Verify Setup

### 1. Check App Dashboard

Visit: https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-settings/

**Verify:**
- [ ] Webhook URL shows your Railway URL
- [ ] Green checkmark next to webhook
- [ ] "messages" field shows "Subscribed"

### 2. Check WhatsApp Manager

Visit: https://business.facebook.com/latest/whatsapp_manager/overview/?business_id=482336855815272&asset_id=1882325359327958

**Verify:**
- [ ] Phone number shows "Connected"
- [ ] Display name configured
- [ ] Profile photo (optional but recommended)

### 3. Test API Connection

From API Setup page:
1. Find "Send and receive messages"
2. Select recipient (your personal number)
3. Click "Send message"
4. Check WhatsApp - should receive "Hello World"

✅ If received, API connection works!

### 4. Test Webhook

Send WhatsApp message to your business number:
```
Hello
```

**Check Railway logs:**
```bash
railway logs
```

**Expected:**
```
📱 +1234567890 [idle]: Hello
📤 Sent to +1234567890: Welcome to MyBambu!
```

✅ If you see this, webhook works!

---

## 🚨 Common Issues & Fixes

### Issue: "Webhook verification failed"

**Checklist:**
1. Railway app running? → `railway logs`
2. Health endpoint works? → `curl https://your-url/health`
3. Token matches exactly? → Check Railway env vars
4. URL has `/webhook`? → Not just base URL
5. Using HTTPS? → Railway provides this automatically

**Fix:**
```bash
# Check env vars
railway variables

# Should see:
# WEBHOOK_VERIFY_TOKEN=xxx (this must match Facebook)

# If wrong:
railway variables set WEBHOOK_VERIFY_TOKEN="correct_token"
```

### Issue: "Number already in use"

See: `../../WHATSAPP-NUMBER-FIX.md`

**Quick fix:**
- Option A: Migrate from existing WABA
- Option B: Use new number
- Option C: Enable coexistence (App + API together)

### Issue: "Access token invalid/expired"

**Symptoms:**
- Can't send messages
- 401 errors in logs

**Fix:**
Generate permanent system user token (see above) instead of temporary token.

### Issue: "Messages not arriving at webhook"

**Checklist:**
1. Webhook subscribed to "messages"? → Check Configuration page
2. Token valid? → Test API call
3. Your number added to test recipients? → Add in API Setup
4. App in correct mode? → Dev mode requires approved numbers

**Fix:**
```bash
# Check which events you're subscribed to
# Go to: https://developers.facebook.com/apps/1887037432191884/whatsapp-business/wa-settings/

# Should see "messages" with status "Subscribed"
```

### Issue: "Can't send messages"

**Checklist:**
1. Phone Number ID correct? → Check WhatsApp Manager
2. Access token valid? → Regenerate if needed
3. Recipient approved? → Add to test numbers
4. In Dev mode, only 5 numbers work

**Fix:**
```bash
# Verify env vars in Railway
railway variables

# Should have:
# WHATSAPP_ACCESS_TOKEN=EAA...
# WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

---

## 📋 Configuration Checklist

### Facebook/WhatsApp Setup:
- [ ] App created (ID: 1887037432191884) ✅
- [ ] Business Account (ID: 482336855815272) ✅
- [ ] WhatsApp product added ✅
- [ ] Use case: WHATSAPP_BUSINESS_MESSAGING ✅
- [ ] Phone number added and verified
- [ ] Access token generated (temp or permanent)
- [ ] Phone Number ID copied
- [ ] Test recipient added (your personal number)
- [ ] Sent test message successfully

### Railway Deployment:
- [ ] Deployed to Railway
- [ ] Environment variables set
- [ ] Health endpoint returns 200
- [ ] Public URL obtained

### Webhook Configuration:
- [ ] Callback URL configured
- [ ] Verify token matches
- [ ] Webhook verified (green checkmark)
- [ ] Subscribed to "messages" field
- [ ] Test message received and replied

### End-to-End Test:
- [ ] Send "Hello" → Receive welcome message
- [ ] Send "Send $100 to Mexico" → Bot guides through flow
- [ ] Complete full transfer in DEMO mode
- [ ] Check logs show no errors

---

## 🎯 Next Actions

### Right Now:

1. **Get credentials** (above)
2. **Deploy to Railway:**
   ```bash
   cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers
   npm install -g @railway/cli
   railway login
   railway init
   railway variables set WHATSAPP_ACCESS_TOKEN="EAA..."
   railway variables set WHATSAPP_PHONE_NUMBER_ID="123..."
   railway variables set WEBHOOK_VERIFY_TOKEN="random_token"
   railway up
   railway domain
   ```
3. **Configure webhook** in Facebook
4. **Test!**

### This Week:

1. Generate permanent system user token
2. Complete full transfer test
3. Switch to PRODUCTION mode (when ready)
4. Test with real (small) transfer

---

## 📚 Official Documentation References

All information verified against:
- ✅ App Registration: https://developers.facebook.com/docs/development/register
- ✅ Create App: https://developers.facebook.com/docs/development/create-an-app/
- ✅ WhatsApp Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- ✅ Webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
- ✅ API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api/reference

**Your specific URLs:**
- App: https://developers.facebook.com/apps/1887037432191884
- Business: https://business.facebook.com/settings/?business_id=482336855815272
- WhatsApp: https://business.facebook.com/latest/whatsapp_manager/overview/?business_id=482336855815272&asset_id=1882325359327958

---

## 🆘 Still Stuck?

**For Facebook/WhatsApp issues:**
- Meta Developer Docs: https://developers.facebook.com/docs/whatsapp
- Meta Developer Support: https://developers.facebook.com/support/
- Community: https://www.facebook.com/groups/whatsappbusiness

**For your app issues:**
- Check: `DEPLOY-RAILWAY.md`
- Check: `TROUBLESHOOTING.md`
- Logs: `railway logs`
- Health: `https://your-url/health`

---

**Setup verified against official Facebook documentation ✅**

**Time to complete:** 15-20 minutes
**Difficulty:** Medium (Facebook UI is confusing, but we've got you covered!)
**Result:** Working WhatsApp money transfer bot! 🚀
