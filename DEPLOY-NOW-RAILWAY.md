# 🚀 Deploy to Railway NOW! (2 Minutes)

Everything is ready! Just run 2 commands.

---

## ⚡ Quick Deploy

### Step 1: Login to Railway
```bash
railway login
```

**What happens:**
- Browser opens
- Login with GitHub (or email)
- Terminal shows: "✅ Logged in as edisonjoao1"

### Step 2: Run Deploy Script
```bash
./deploy.sh
```

**What the script does:**
1. Creates Railway project: `bambu-whatsapp`
2. Sets all environment variables (your credentials already in script!)
3. Deploys the app
4. Gets your public URL

**Takes:** ~2 minutes

---

## 📋 Manual Steps (If Script Fails)

If deploy.sh doesn't work, run these commands one by one:

```bash
# 1. Create project
railway init --name bambu-whatsapp

# 2. Set environment variables
railway variables set WHATSAPP_ACCESS_TOKEN="EAAc7PlLT7ZBABPZBkpt8DWKFL6izg98ZBsdYZAb5N5GdH84Q2J3Bp3HUtiZB0ie64aquqZB0tpJEdRZAoRVZBjTsIAfFteLiG39RTpWM39ncmZB3jUjFtPW5NLSeLfKQYjNmzHyLPQ216N0IV5NkX9ZCuxypiQDRQ8P7dCGNKFyizqsI8kMeMs8OHQuXmF3j99ZCLukvxIofPsQDipKTJEuzG3ZBlDWrNix7KTtCZAVsexU5jmC1HAcKbfQZBvnxM3dUgwGNFNZBotaVPdmk1gRBuoYojcZD"

railway variables set WHATSAPP_PHONE_NUMBER_ID="826251713912705"

railway variables set WEBHOOK_VERIFY_TOKEN="bambusend_secure_2024"

railway variables set MODE="DEMO"

railway variables set WISE_API_KEY="1624cba2-cdfa-424f-91d8-787a5225d52e"

railway variables set WISE_PROFILE_ID="29182377"

railway variables set WISE_API_URL="https://api.sandbox.transferwise.tech"

railway variables set PORT="3000"

# 3. Deploy
railway up

# 4. Get URL
railway domain
```

---

## 🌐 After Deployment

### Get Your URL
```bash
railway domain
```

**You'll see:**
```
https://bambu-whatsapp-production.up.railway.app
```

**✅ COPY THIS URL!**

### Test Your Server
```bash
curl https://your-railway-url.up.railway.app/health
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

✅ **Server is live!**

---

## 🔗 Configure Facebook Webhook

### 1. Go to Facebook Developers
**Open:** https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/

(Replace YOUR_APP_ID with your actual app ID)

### 2. Find "Webhook" Section
Scroll to **"Webhook"** section → Click **"Edit"**

### 3. Enter Details
**Callback URL:**
```
https://your-railway-url.up.railway.app/webhook
```
(Use YOUR Railway URL from above)

**Verify token:**
```
bambusend_secure_2024
```

### 4. Click "Verify and Save"
✅ Green checkmark should appear!

### 5. Subscribe to Events
Find **"Webhook fields"** → Subscribe to:
- ✅ **messages** (REQUIRED)

---

## 🧪 Test!

### Send Test Message
From YOUR WhatsApp, send to:
```
To: +1 555 159 4893
Message: Hello
```

### Check Railway Logs
```bash
railway logs --follow
```

**Expected:**
```
📱 +1234567890 [idle]: Hello
📤 Sent to +1234567890: 👋 Welcome to MyBambu!...
```

### Test Full Transfer
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

✅ **Working!**

---

## 🆘 Quick Commands

**View logs:**
```bash
railway logs --follow
```

**Check variables:**
```bash
railway variables
```

**Redeploy:**
```bash
railway up
```

**Open dashboard:**
```bash
railway open
```

**Get domain:**
```bash
railway domain
```

---

## ✅ Success Checklist

- [ ] Logged into Railway
- [ ] Ran `./deploy.sh` or manual commands
- [ ] Got Railway URL
- [ ] Health endpoint returns 200
- [ ] Configured webhook in Facebook
- [ ] Webhook verified (green checkmark)
- [ ] Subscribed to "messages"
- [ ] Sent "Hello" → Received reply
- [ ] Tested full transfer flow

**All checked?** You have a working WhatsApp bot! 🎉

---

## 📊 Railway Dashboard

**After deployment, check:**
- https://railway.app/project/YOUR_PROJECT_ID
- See: Deployments, Logs, Metrics, Variables

---

**Time:** 2 minutes
**Cost:** Uses your $5 credit (should last weeks!)
**Result:** Live WhatsApp money transfer bot! 🚀

**GitHub:** https://github.com/edisonjoao1/mybambu-whatsapp-transfers
