# 🚀 Deploy WhatsApp Bot to Railway (Without ngrok!)

**Time: 10 minutes**
**Cost: Free ($5 credit/month)**

Since ngrok is blocked on your work computer, we'll deploy directly to Railway for a stable, production HTTPS URL.

---

## ✅ Why Railway?

- ✅ No ngrok needed - direct public HTTPS URL
- ✅ Free $5 credit/month (enough for MVP)
- ✅ Auto-detects Node.js projects
- ✅ Automatic HTTPS/SSL
- ✅ Environment variables via dashboard
- ✅ Auto-restart on failure
- ✅ Built-in logs and monitoring
- ✅ Perfect for WhatsApp webhooks

---

## 📋 Prerequisites

Before deploying, get these ready:

### From Facebook/WhatsApp:
- [ ] **WHATSAPP_ACCESS_TOKEN** - Get from: developers.facebook.com → Your App (1887037432191884) → WhatsApp → API Setup → Generate Token
- [ ] **WHATSAPP_PHONE_NUMBER_ID** - Get from: Same page, copy Phone Number ID
- [ ] **Verify Token** - Create a secure random string: `openssl rand -base64 32`

### From Wise (Optional for DEMO mode):
- [ ] WISE_API_KEY (you have: `1624cba2-cdfa-424f-91d8-787a5225d52e`)
- [ ] WISE_PROFILE_ID (you have: `29182377`)

---

## 🚀 Deployment Steps

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

Expected output:
```
added 1 package
```

### Step 2: Login to Railway

```bash
railway login
```

This opens your browser. Sign up/login with:
- GitHub (recommended)
- Google
- Email

### Step 3: Navigate to Project

```bash
cd /Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers
```

### Step 4: Test Build Locally (Optional but Recommended)

```bash
npm run build
```

Expected:
```
> mybambu-whatsapp-transfers@1.0.0 build
> tsc
```

If errors, fix before deploying.

### Step 5: Initialize Railway Project

```bash
railway init
```

Prompts:
```
? Enter project name: mybambu-whatsapp
? Select a team: (choose your team or personal)
```

This creates a new Railway project.

### Step 6: Set Environment Variables

**Option A: Via CLI (Fastest)**

```bash
# Required - WhatsApp credentials
railway variables set WEBHOOK_VERIFY_TOKEN="your_secure_random_token_here"
railway variables set WHATSAPP_ACCESS_TOKEN="EAA...your_token_from_facebook"
railway variables set WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"

# Required - Server config
railway variables set MODE="DEMO"
railway variables set PORT="3000"

# Optional - Wise credentials (for PRODUCTION mode later)
railway variables set WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e"
railway variables set WISE_PROFILE_ID="29182377"
railway variables set WISE_API_URL="https://api.sandbox.transferwise.tech"
```

**Option B: Via Dashboard**

1. Run `railway open` to open dashboard
2. Go to your project → Variables tab
3. Click "New Variable"
4. Add each variable:
   - `WEBHOOK_VERIFY_TOKEN` = your token
   - `WHATSAPP_ACCESS_TOKEN` = your token
   - `WHATSAPP_PHONE_NUMBER_ID` = your ID
   - `MODE` = `DEMO`
   - etc.

### Step 7: Deploy! 🎉

```bash
railway up
```

Expected output:
```
Building...
✓ Build successful
Deploying...
✓ Deployment successful
```

This:
1. Uploads your code
2. Installs dependencies (`npm install`)
3. Builds TypeScript (`npm run build`)
4. Starts server (`npm start`)
5. Exposes it publicly with HTTPS

### Step 8: Get Your Public URL

```bash
railway domain
```

Expected output:
```
https://mybambu-whatsapp-production.up.railway.app
```

**COPY THIS URL** - you'll need it for Facebook!

---

## 🔗 Configure Facebook Webhook

Now that you have a public HTTPS URL, configure Facebook to send messages to it:

### Step 1: Go to Facebook Developer Console

Visit: https://developers.facebook.com/apps/1887037432191884

### Step 2: Navigate to WhatsApp Configuration

Left sidebar → **WhatsApp** → **Configuration**

### Step 3: Configure Webhook

Find "Webhook" section, click **Edit** (or "Configure webhooks" if first time)

**Enter:**
- **Callback URL:** `https://mybambu-whatsapp-production.up.railway.app/webhook`
  - Replace with YOUR Railway URL
  - Must include `/webhook` at the end
  - Must be HTTPS

- **Verify Token:** (same as your `WEBHOOK_VERIFY_TOKEN` env var)
  - MUST match exactly
  - Case-sensitive

Click **Verify and Save**

**Expected:** Green checkmark ✅

**If verification fails:**
- Check Railway logs: `railway logs`
- Verify token matches exactly
- Test health endpoint: `curl https://your-url.railway.app/health`

### Step 4: Subscribe to Webhook Fields

After verification, you'll see "Webhook fields" section.

Click **Manage** button.

**Subscribe to:**
- ✅ **messages** (REQUIRED - for incoming messages)
- ✅ **message_status** (optional - delivery/read receipts)

Click **Subscribe** for each.

---

## 🧪 Test Your Deployment

### Test 1: Health Check

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "mode": "DEMO",
  "wiseConnected": false,
  "whatsappConfigured": true
}
```

✅ If you see this, server is running!

### Test 2: Webhook Verification (Manual)

```bash
curl "https://your-app.railway.app/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Expected: `test123`

### Test 3: Send WhatsApp Message

**Prerequisites:**
1. Your personal phone number must be added as test recipient
2. Go to: developers.facebook.com → Your App → WhatsApp → API Setup
3. Find "Send and receive messages" section
4. Click "Manage phone number list"
5. Add your phone number with country code (e.g., +15551234567)
6. Verify via code sent to WhatsApp

**Send Test Message:**

From YOUR phone, send WhatsApp message to your business number:
```
Hello
```

**Expected:**
1. Server logs show: `📱 +1234567890 [idle]: Hello`
2. You receive reply: `👋 Welcome to MyBambu! ...`

**Check Logs:**
```bash
railway logs
```

You should see:
```
🚀 MyBambu WhatsApp Server
📍 Port: 3000
✅ WhatsApp: Configured
🎭 Mode: DEMO
📱 +1234567890 [idle]: Hello
📤 Sent to +1234567890: Welcome to MyBambu!
```

### Test 4: Full Transfer Flow

```
You: Send $100 to Mexico
Bot: ✅ Sending $100 USD to Mexico
     📝 What's the recipient's full name?

You: Juan Garcia
Bot: ✅ Recipient: Juan Garcia
     📋 I need their bank details...

You: 032180000118359719
Bot: ✅ Ready to Send!
     Type "CONFIRM" to send

You: CONFIRM
Bot: ✅ Transfer Demo
     This is a demo. No real money sent.
```

---

## 🎯 Next Steps After Successful Deployment

### 1. Get Permanent Access Token

The token from API Setup expires in 24 hours. For production, generate a permanent token:

**Steps:**
1. Go to: https://business.facebook.com/settings
2. Select your Business Account (ID: 482336855815272)
3. Click **Users** → **System Users**
4. Click **Add** → Create "MyBambu WhatsApp Bot" (Admin role)
5. Click on new system user → **Generate New Token**
6. Select your app (1887037432191884)
7. Permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
8. Click **Generate Token**
9. **COPY TOKEN** (shown only once!)
10. Update Railway:
    ```bash
    railway variables set WHATSAPP_ACCESS_TOKEN="your_permanent_token"
    ```

### 2. Switch to Production Mode

When ready for real transfers:

```bash
# Update environment variables
railway variables set MODE="PRODUCTION"
railway variables set WISE_API_URL="https://api.transferwise.com"

# Redeploy
railway up
```

⚠️ **IMPORTANT:** In PRODUCTION mode, real money is sent!

### 3. Add Custom Domain (Optional)

Instead of `*.railway.app`, use your own domain:

1. Railway Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `whatsapp.mybambu.com`)
4. Add CNAME record to your DNS:
   ```
   whatsapp.mybambu.com → CNAME → your-app.railway.app
   ```
5. Update webhook URL in Facebook

### 4. Set Up Monitoring

```bash
# View live logs
railway logs --follow

# View logs in dashboard
railway open
# Click "Deployments" → Click latest deployment → View logs
```

**Set up alerts:**
1. Railway Dashboard → Settings → Notifications
2. Add your email
3. Get notified on deployment failures

### 5. Enable Auto-Deploy (Optional)

Connect GitHub for automatic deployments on push:

1. Railway Dashboard → Settings → GitHub
2. Connect repo
3. Select branch (e.g., `main`)
4. Enable "Auto-deploy"

Now every git push triggers deployment!

---

## 🐛 Troubleshooting

### Issue: "railway: command not found"

**Fix:**
```bash
npm install -g @railway/cli

# If permission error:
sudo npm install -g @railway/cli

# Or use npx (no install needed):
npx @railway/cli login
npx @railway/cli up
```

### Issue: "Webhook verification failed"

**Checklist:**
- [ ] Railway deployment successful? (`railway logs`)
- [ ] Health endpoint accessible? (`curl https://your-url/health`)
- [ ] Verify token matches EXACTLY? (check Railway variables)
- [ ] URL includes `/webhook`? Not just base URL
- [ ] Using HTTPS? Not HTTP

**Debug:**
```bash
# Check logs during verification
railway logs --follow

# You should see:
# 🔍 Webhook verification attempt: { mode: subscribe, token: ✅ }
# ✅ Webhook verified!
```

### Issue: "Messages not arriving"

**Checklist:**
- [ ] Webhook subscribed to "messages" field?
- [ ] Your phone number added to test recipients?
- [ ] Access token valid? (not expired)
- [ ] Phone number ID correct in env vars?

**Debug:**
```bash
# Send message, then check logs
railway logs

# Should see:
# 📱 +1234567890 [idle]: Hello
```

If you see the message in logs but no response:
- Check WHATSAPP_ACCESS_TOKEN is correct
- Check WHATSAPP_PHONE_NUMBER_ID is correct

### Issue: "Build failed"

**Fix:**
```bash
# Test build locally first
npm run build

# If errors, fix them
# Common issues:
# - TypeScript errors
# - Missing dependencies
# - Wrong Node version

# Then redeploy:
railway up
```

### Issue: "Server keeps restarting"

**Check logs:**
```bash
railway logs
```

**Common causes:**
- Missing environment variables
- Port binding issues (Railway sets PORT automatically)
- Uncaught exceptions

**Your server handles PORT correctly:**
```typescript
const PORT = process.env.PORT || 3000;
```

### Issue: "Out of free credits"

Railway free tier: $5/month

**Check usage:**
```bash
railway open
# Dashboard → Usage
```

**If exceeded:**
- Add payment method ($5-10/month typical)
- Or use Render.com free tier (750 hours/month)

---

## 💰 Cost Breakdown

**Railway Free Tier:**
- $5 credit/month
- Includes:
  - 512MB RAM
  - 1GB storage
  - 100GB bandwidth
- **Typical usage for this app:** $2-4/month
- **Estimate:** 2-3 months free testing

**After free credits:**
- Pay as you go: ~$5/month for this app
- Can add payment method in dashboard

**Alternative Free Options:**
- **Render:** 750 hours/month free (enough for MVP)
- **Fly.io:** 3 VMs free forever
- **Heroku:** $7/month minimum (expensive)

---

## 📊 Monitoring Your App

### View Logs

```bash
# Live logs
railway logs --follow

# Last 100 lines
railway logs

# In dashboard
railway open
# Click "Deployments" → Latest → "View Logs"
```

### Key Metrics to Watch

**In Railway Dashboard:**
- **CPU Usage:** Should be <10% normally
- **Memory:** Should be <100MB
- **Network:** Incoming webhooks + outgoing API calls
- **Errors:** Watch for crashes/restarts

**In Your Logs:**
- `📱` = Incoming message (good!)
- `📤` = Outgoing message (good!)
- `❌` = Error (investigate)
- `✅` = Success (good!)

### Health Checks

Railway automatically hits `/health` endpoint every 60 seconds.

If health check fails 3 times, Railway restarts your app.

**Your health endpoint:**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: MODE,
    wiseConnected: MODE === 'PRODUCTION' && !!WISE_API_KEY,
    whatsappConfigured: !!WHATSAPP_TOKEN && !!PHONE_NUMBER_ID
  });
});
```

---

## 🔐 Security Best Practices

### 1. Rotate Tokens Regularly

```bash
# Every 90 days, generate new token and update:
railway variables set WHATSAPP_ACCESS_TOKEN="new_token"
```

### 2. Use System User Tokens (Not Personal)

Personal tokens:
- ❌ Expire after 24 hours
- ❌ Tied to your Facebook account
- ❌ Revoked if password changes

System user tokens:
- ✅ Never expire
- ✅ Not tied to personal account
- ✅ Survive password changes

### 3. Add Webhook Signature Verification (Recommended)

Facebook signs webhooks with HMAC SHA-256.

**Add to your server.ts:**
```typescript
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.APP_SECRET || '')
    .update(body)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;

  if (!verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.sendStatus(403);
  }

  // ... rest of handler
});
```

Get APP_SECRET from: developers.facebook.com → Your App → Settings → Basic

### 4. Rate Limiting (Production)

Add rate limiting to prevent abuse:

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/webhook', limiter);
```

---

## 📝 Deployment Checklist

Before going live:

- [ ] Railway deployment successful
- [ ] Health endpoint returns 200
- [ ] Webhook verified in Facebook
- [ ] Subscribed to "messages" field
- [ ] Permanent access token generated (not 24h temp)
- [ ] Test phone number added to recipients
- [ ] Sent "Hello" and received reply
- [ ] Completed full transfer flow in DEMO mode
- [ ] Environment variables set correctly
- [ ] Logs showing no errors
- [ ] Monitoring/alerts configured

**Optional (Production):**
- [ ] Custom domain configured
- [ ] Webhook signature verification added
- [ ] Rate limiting enabled
- [ ] Business verification completed
- [ ] Payment method added to Facebook
- [ ] Message templates created and approved
- [ ] Switched to PRODUCTION mode
- [ ] Tested with real (small) transfer

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ WhatsApp bot deployed to Railway
✅ Public HTTPS URL (no ngrok needed!)
✅ Webhook configured in Facebook
✅ Receiving and responding to messages
✅ Full conversational transfer flow working
✅ Free hosting (for now)

**Your webhook URL:**
```
https://your-app-name.railway.app/webhook
```

**Next:** Send "Hello" to your WhatsApp business number and watch the magic! 🚀

---

## 🆘 Need Help?

**Railway Issues:**
- Docs: https://docs.railway.app
- Community: https://discord.gg/railway

**WhatsApp Issues:**
- Check: `SETUP-CHECKLIST.md`
- Check: `../../WHATSAPP-NUMBER-FIX.md`
- Logs: `railway logs`

**App Issues:**
- Check: `README.md`
- Check server logs
- Health endpoint: `/health`

---

**Deployment time:** 10 minutes
**Cost:** Free ($5 credit/month)
**Result:** Production WhatsApp bot! 🎉
