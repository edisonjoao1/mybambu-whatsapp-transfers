# 🚀 Deploy to Vercel (5 Minutes)

Your code is ready! Here's how to deploy to Vercel.

---

## ✅ Why Vercel?

- **Free**: Generous free tier
- **Always on**: No sleeping (serverless)
- **GitHub integration**: Auto-deploy on push
- **HTTPS**: Automatic SSL
- **Fast**: Global CDN

---

## 🎯 Step 1: Import GitHub Repo

### 1.1: Go to Vercel

**Open:** https://vercel.com/

**Login with GitHub** (if not already logged in)

### 1.2: Click "Add New Project"

You'll see a button: **"Add New..." → "Project"**

### 1.3: Import Your Repository

1. Find **mybambu-whatsapp-transfers** in the list
2. Click **"Import"**

---

## 🔧 Step 2: Configure Project

### 2.1: Configure Project Settings

**Project Name:** `mybambu-whatsapp-transfers` (or whatever you want)

**Framework Preset:** Select **"Other"** (we have custom config)

**Root Directory:** Leave as `./` (root)

**Build Command:** Leave default or set to `npm run build`

**Output Directory:** Leave as `dist`

### 2.2: Add Environment Variables

Click **"Environment Variables"** section, then add these **one by one**:

```bash
WHATSAPP_ACCESS_TOKEN=EAAc7PlLT7ZBABPZBkpt8DWKFL6izg98ZBsdYZAb5N5GdH84Q2J3Bp3HUtiZB0ie64aquqZB0tpJEdRZAoRVZBjTsIAfFteLiG39RTpWM39ncmZB3jUjFtPW5NLSeLfKQYjNmzHyLPQ216N0IV5NkX9ZCuxypiQDRQ8P7dCGNKFyizqsI8kMeMs8OHQuXmF3j99ZCLukvxIofPsQDipKTJEuzG3ZBlDWrNix7KTtCZAVsexU5jmC1HAcKbfQZBvnxM3dUgwGNFNZBotaVPdmk1gRBuoYojcZD
```

```bash
WHATSAPP_PHONE_NUMBER_ID=826251713912705
```

```bash
WEBHOOK_VERIFY_TOKEN=bambusend_secure_2024
```

```bash
MODE=DEMO
```

```bash
WISE_API_KEY=1624cba2-cdfa-424f-91d8-787a5225d52e
```

```bash
WISE_PROFILE_ID=29182377
```

```bash
WISE_API_URL=https://api.sandbox.transferwise.tech
```

**Important:** Make sure to select **"Production"** environment for each variable!

### 2.3: Click "Deploy"

Vercel will:
1. Clone your repo
2. Install dependencies
3. Build TypeScript
4. Deploy to serverless functions

**Takes:** 1-2 minutes

---

## 🌐 Step 3: Get Your URL

After deployment completes, you'll see:

```
🎉 Deployment ready!

https://mybambu-whatsapp-transfers.vercel.app
```

**✅ COPY THIS URL!**

### Test the deployment:

```bash
curl https://your-project-name.vercel.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "mode": "DEMO",
  "wiseConnected": false,
  "whatsappConfigured": true
}
```

✅ **If you see this, your server is live!**

---

## 🔗 Step 4: Configure Facebook Webhook

### 4.1: Go to Facebook Developer Console

**Open:** https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/

(Replace YOUR_APP_ID with your actual app ID)

### 4.2: Find "Webhook" Section

Scroll down to **"Webhook"** section

Click **"Edit"** or **"Configure webhooks"**

### 4.3: Enter Your Vercel URL

**Callback URL:**
```
https://your-project-name.vercel.app/webhook
```
(Use YOUR Vercel URL from Step 3)

**Verify token:**
```
bambusend_secure_2024
```

### 4.4: Click "Verify and Save"

**What happens:**
- Facebook sends GET request to your Vercel function
- Your function responds with the challenge
- ✅ Green checkmark appears!

**If verification fails:**
- Check Vercel deployment logs (click on deployment → "Functions" tab)
- Verify token must match exactly: `bambusend_secure_2024`
- URL must end with `/webhook`

### 4.5: Subscribe to Events

After verification succeeds, find **"Webhook fields"**

**Subscribe to:**
- ✅ **messages** (REQUIRED)

Click **"Subscribe"**

---

## 🧪 Step 5: Test!

### 5.1: Send Test Message

From YOUR phone (WhatsApp), send to test number:
```
To: +1 555 159 4893
Message: Hello
```

### 5.2: Check Vercel Logs

In Vercel dashboard:
1. Go to your project
2. Click **"Functions"** tab
3. See real-time logs

**Expected:**
```
📱 +1234567890 [idle]: Hello
📤 Sent to +1234567890: 👋 Welcome to MyBambu!...
```

### 5.3: Check WhatsApp

You should receive the bot's welcome message! 🎉

### 5.4: Test Full Transfer Flow

```
You: Send $100 to Mexico

Bot: ✅ Sending $100 USD to Mexico
     📝 What's the recipient's full name?

You: Maria Garcia

Bot: ✅ Recipient: Maria Garcia
     📋 I need their CLABE number (18 digits)...

You: 032180000118359719

Bot: ✅ Ready to Send!
     💰 You send: $100 USD
     📩 Maria Garcia receives: ~1,720 MXN
     Type "CONFIRM" to send

You: CONFIRM

Bot: ✅ Transfer Demo
     This is a demo. No real money sent.
```

✅ **If this works, you're DONE!**

---

## 🔄 Auto-Deploy on Push

**Bonus:** Vercel automatically redeploys when you push to GitHub!

```bash
# Make any code change
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys! 🚀
```

No manual redeployment needed!

---

## 📊 Monitoring

### View Logs

**In Vercel dashboard:**
1. Your project → **"Functions"** tab
2. Real-time logs for each webhook call

### View Analytics

**In Vercel dashboard:**
1. Your project → **"Analytics"** tab
2. See request counts, response times, errors

---

## 🆘 Troubleshooting

### Webhook verification fails

**Check:**
1. Vercel deployment succeeded? (green checkmark)
2. Environment variables set correctly?
3. Token matches exactly: `bambusend_secure_2024`

**Test manually:**
```bash
curl "https://your-url.vercel.app/webhook?hub.mode=subscribe&hub.verify_token=bambusend_secure_2024&hub.challenge=test123"
```

Should return: `test123`

### Messages not arriving

**Check:**
1. Webhook subscribed to "messages" field? ✅
2. Your phone number added to test recipients in Facebook?
3. Logs show incoming message in Vercel Functions tab?

### Can't send messages

**Check environment variables in Vercel:**
1. Go to project → **"Settings"** → **"Environment Variables"**
2. Verify all are set:
   - `WHATSAPP_ACCESS_TOKEN` = EAAc7PlLT7ZBA...
   - `WHATSAPP_PHONE_NUMBER_ID` = 826251713912705
   - `WEBHOOK_VERIFY_TOKEN` = bambusend_secure_2024

### Build fails

**Common issue:** TypeScript compilation errors

**Fix:**
1. Check Vercel build logs
2. Test locally: `npm run build`
3. Fix any TypeScript errors
4. Push to GitHub (Vercel auto-redeploys)

---

## ✅ Success Checklist

- [ ] Vercel project created from GitHub repo
- [ ] All environment variables set
- [ ] Deployment succeeded (green checkmark)
- [ ] Health endpoint returns 200
- [ ] Webhook verified in Facebook (green checkmark)
- [ ] Subscribed to "messages" field
- [ ] Sent "Hello" → Received reply
- [ ] Tested full transfer flow
- [ ] Auto-deploy works (push to GitHub)

**All checked?** You have a production-ready WhatsApp bot on Vercel! 🚀

---

## 💡 Vercel vs Other Platforms

| Feature | Vercel | Railway | Render |
|---------|--------|---------|--------|
| **Free tier** | ✅ Generous | ⏰ Trial (8 days left) | ✅ Limited |
| **Always on** | ✅ Serverless | ✅ Always | ⚠️ Sleeps after 15 min |
| **Auto-deploy** | ✅ GitHub | ✅ GitHub | ✅ GitHub |
| **HTTPS** | ✅ Free | ✅ Free | ✅ Free |
| **Logs** | ✅ Real-time | ✅ Real-time | ✅ Real-time |
| **Cold starts** | ~1-2 sec | None | None |
| **Best for** | Webhooks, APIs | Full apps | Background jobs |

**Verdict:** Vercel is perfect for WhatsApp webhooks! Serverless means no cold starts for webhooks, always responds fast.

---

## 🎯 What You Built

A **production-ready conversational money transfer system** that:
- ✅ Handles natural conversation via rule-based state machine
- ✅ Collects bank details intelligently
- ✅ Validates country-specific requirements (CLABE, Cédula, etc.)
- ✅ Integrates with Wise API for real transfers
- ✅ Supports 5 countries (Mexico, Colombia, Brazil, UK, EU)
- ✅ Has demo + production modes
- ✅ Deploys via serverless (scales automatically)
- ✅ Auto-deploys on git push
- ✅ **NO AI API needed** (rule-based = free, predictable, fast!)

**This is production-quality, adapted for WhatsApp!**

---

**Time:** 5-10 minutes
**Cost:** FREE (within Vercel limits)
**Result:** Live WhatsApp bot! 🎉

**GitHub:** https://github.com/edisonjoao1/mybambu-whatsapp-transfers
**Next:** Configure webhook and test!
