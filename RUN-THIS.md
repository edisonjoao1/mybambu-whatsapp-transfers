# 🚀 RUN THIS NOW!

## Step 1: Login to Railway (Opens Browser)

```bash
railway login
```

**What happens:** Browser opens → Login with GitHub

---

## Step 2: Run Deployment Script

```bash
./deploy.sh
```

**What it does:**
- ✅ Creates Railway project
- ✅ Sets all environment variables (with YOUR credentials!)
- ✅ Deploys the app
- ✅ Gets your public URL

**Takes:** ~2 minutes

---

## Step 3: Copy Your URL

After script finishes, you'll see:
```
🎉 SUCCESS! Your WhatsApp bot is live at:

   https://bambu-whatsapp-production.up.railway.app
```

**✅ COPY THAT URL!**

---

## Step 4: Configure Webhook in Facebook

**Go to:** https://developers.facebook.com/apps/YOUR_APP_ID/whatsapp-business/wa-settings/

**Find:** "Webhook" section → Click "Edit"

**Enter:**
- Callback URL: `https://your-url.railway.app/webhook`
- Verify Token: `bambusend_secure_2024`

**Subscribe to:** messages ✅

**Click:** "Verify and Save"

---

## Step 5: Test!

**Send WhatsApp message to:** +1 555 159 4893

**Message:** `Hello`

**Expected:** Bot replies with welcome message! 🎉

---

## 🎯 Full Test Conversation

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

## 🔧 Troubleshooting

**View logs:**
```bash
railway logs --follow
```

**Check health:**
```bash
curl https://your-url.railway.app/health
```

**Redeploy:**
```bash
railway up
```

---

## 📝 Summary

**Two commands:**
```bash
railway login
./deploy.sh
```

**Then:** Configure webhook in Facebook

**Result:** Working WhatsApp money transfer bot! 🚀

---

**TIME:** 5 minutes
**RESULT:** Production-ready bot!
