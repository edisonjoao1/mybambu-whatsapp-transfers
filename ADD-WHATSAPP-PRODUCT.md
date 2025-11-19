# 📱 How to Add WhatsApp Product to Your App

## Step-by-Step Visual Guide

---

## 🎯 Step 1: Go to Your App Dashboard

**Open this URL:**
```
https://developers.facebook.com/apps
```

**You'll see:**
- List of your apps
- Or "Create App" button if you don't have one

---

## 🆕 If You DON'T Have an App Yet

### 1.1: Click "Create App"

### 1.2: Choose App Type
- Select **"Business"** (NOT Consumer)
- Click "Next"

### 1.3: Fill in Details
- **App Name:** "Bambu Send" (or whatever you want)
- **App Contact Email:** Your email
- **Business Account:** Select your business (or create one)

### 1.4: Click "Create App"

**Result:** App created! You'll see the dashboard.

---

## ✅ If You Already Have an App

### Click on your app name

**Example:**
- "Bambu Send WhatsApp"
- App ID: 1887037432191884

**You'll see:** The app dashboard

---

## 📦 Step 2: Add WhatsApp Product

### 2.1: Look for "Add Products to Your App"

**On the left sidebar, you'll see:**
- Dashboard
- Use Cases
- **Add products** ← Click here

**OR find the section in the main area:**
- Big heading: "Add products to your app"
- List of available products

### 2.2: Find WhatsApp

**Look for the card that says:**
```
┌─────────────────────┐
│   WhatsApp          │
│                     │
│   [WhatsApp Icon]   │
│                     │
│   Set up            │ ← Click this button
└─────────────────────┘
```

### 2.3: Click "Set up" on WhatsApp

**What happens:**
- WhatsApp product gets added to your app
- You'll be redirected to WhatsApp setup page

**You'll see:**
- WhatsApp now appears in left sidebar
- Options like "Getting Started", "API Setup", "Configuration"

---

## 🔗 Step 3: Link to Business Account (Important!)

After adding WhatsApp, you need to link it to a WhatsApp Business Account.

### 3.1: You'll See a Setup Screen

**Look for:**
- "Get started with the WhatsApp Business Platform"
- Or "Link a Business Account"

### 3.2: Choose Your Business Account

**If you have one:**
- Select your existing Business Account
- Click "Continue"

**If you DON'T have one:**
- Click "Create a WhatsApp Business Account"
- Follow prompts:
  - Account name: "Bambu Send"
  - Time zone: Your time zone
  - Click "Continue"

### 3.3: Add Phone Number

**You'll be prompted to add a phone number:**

**Option A: Use existing number**
- Enter phone number (must not be on WhatsApp already)
- Verify via SMS
- Complete setup

**Option B: Later**
- Skip for now
- Add phone number later in WhatsApp Manager

---

## ✅ Step 4: Verify WhatsApp Product is Added

### 4.1: Check Left Sidebar

**You should now see:**
```
📱 WhatsApp
   ├── Getting Started
   ├── API Setup          ← You'll use this!
   ├── Configuration      ← And this!
   ├── Message Templates
   └── Analytics
```

### 4.2: Go to "API Setup"

**Click: WhatsApp → API Setup**

**You should see:**
- Phone number dropdown (if you added one)
- "Generate access token" button
- "Send and receive messages" section

✅ **If you see this, WhatsApp product is successfully added!**

---

## 🎯 What to Do Next (After Adding WhatsApp)

### Next 1: Add/Verify Phone Number

**If you haven't added a phone yet:**

1. Go to: https://business.facebook.com
2. WhatsApp Manager → Add phone number
3. Verify with SMS
4. Copy Phone Number ID

### Next 2: Generate Access Token

**In developers console:**
1. WhatsApp → API Setup
2. Click "Generate Token"
3. Copy token (starts with `EAA...`)

### Next 3: Configure Webhook

**In developers console:**
1. WhatsApp → Configuration
2. Find "Webhook" section
3. Click "Edit"
4. Enter:
   - URL: `https://bambu-webhook-edisonespinosa.replit.app/webhook`
   - Token: [your Replit verify token]
5. Subscribe to: messages

### Next 4: Test!

Send "Hello" to your business number → Bot replies!

---

## 🖼️ Visual Reference

### Where to Find "Add Products"

**Left Sidebar:**
```
┌──────────────────────┐
│ Dashboard            │
│ App Settings         │
│ > Use Cases          │
│ > Add Products  ←──  │ Click here
│                      │
│ Or scroll down in    │
│ main area to see:    │
└──────────────────────┘

Main Area:
┌────────────────────────────────────┐
│ Add products to your app           │
│                                    │
│ ┌────────┐ ┌────────┐ ┌────────┐ │
│ │Facebook│ │WhatsApp│ │Instagram│ │
│ │Login   │ │        │ │         │ │
│ │Set up  │ │Set up ←│─│Set up   │ │
│ └────────┘ └────────┘ └────────┘ │
└────────────────────────────────────┘
```

### After Adding WhatsApp

**Left Sidebar Changes:**
```
Before:                After:
┌──────────────┐      ┌──────────────────┐
│ Dashboard    │      │ Dashboard        │
│ Add Products │      │ 📱 WhatsApp      │ ← New!
│              │      │   - API Setup    │
│              │      │   - Configuration│
└──────────────┘      └──────────────────┘
```

---

## ❓ Common Questions

### Q: I don't see "Add Products"
**A:**
- Make sure you're IN your app (click on app name first)
- Look in left sidebar under dashboard
- Or scroll down in main dashboard area

### Q: WhatsApp card shows "Manage" instead of "Set up"
**A:** WhatsApp is already added! Click "Manage" to configure it.

### Q: Can't find WhatsApp in the products list
**A:**
- Make sure your app type is "Business" (not Consumer)
- If Consumer app, you need to create a new Business app

### Q: "You don't have permission to add products"
**A:**
- Make sure you're an admin of the app
- Check app roles in Settings → Basic → App Roles

### Q: WhatsApp asks for Business Verification
**A:**
- You can still use it in Development mode
- Business verification only needed for going Live
- Can test with up to 5 numbers without verification

---

## 🚨 Troubleshooting

### Issue: Can't add phone number

**Check:**
- Phone number not already on WhatsApp
- Phone number can receive SMS
- Correct country code format (+1234567890)

**Fix:**
- Use a different number
- Or migrate existing number (see migration docs)

### Issue: "Business Account required"

**Fix:**
1. Go to https://business.facebook.com
2. Create Business Account
3. Come back and link it to your app

### Issue: WhatsApp product shows error

**Fix:**
1. Remove WhatsApp product
2. Wait 5 minutes
3. Add it again
4. Link to correct Business Account

---

## ✅ Success Checklist

After adding WhatsApp product:

- [ ] WhatsApp appears in left sidebar ✅
- [ ] Can access "API Setup" page ✅
- [ ] Can access "Configuration" page ✅
- [ ] Business Account linked ✅
- [ ] Phone number added (or can add one) ✅
- [ ] Can generate access token ✅

**All checked?** You're ready to configure your webhook!

---

## 🎯 Your Next Steps

1. ✅ Add WhatsApp product (follow this guide)
2. ⏭️ Add phone number in WhatsApp Manager
3. ⏭️ Generate access token
4. ⏭️ Configure webhook with your Replit URL
5. ⏭️ Test!

---

**Time:** 5-10 minutes
**Difficulty:** Easy (just clicking buttons!)
**Result:** WhatsApp product added to your app ✅
