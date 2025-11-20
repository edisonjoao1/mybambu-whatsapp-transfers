# 🧪 Local Testing Guide

Complete guide to test the WhatsApp bot locally before deploying to production.

---

## Prerequisites

- Node.js v20+ installed
- npm or pnpm installed
- OpenAI API key (required for AI support)
- WhatsApp Business Cloud API credentials (optional for webhook testing)
- ngrok installed (optional for webhook testing)

---

## 1. Setup Environment Variables

Update your `.env` file with the required credentials:

```bash
# WhatsApp Business API Configuration
WEBHOOK_VERIFY_TOKEN=mybambu_secret_token_12345
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Wise API Configuration (Sandbox)
WISE_API_KEY=1624cba2-cdfa-424f-91d8-787a5225d52e
WISE_PROFILE_ID=29182377
WISE_API_URL=https://api.sandbox.transferwise.tech

# OpenAI API Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
MODE=DEMO
```

**Important:** You MUST add your OpenAI API key to the `.env` file, or the server will fail to start.

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

---

## 4. Start the Server

```bash
npm start
```

You should see:

```
🚀 Server started on port 3000
✅ WhatsApp webhook configured
✅ Verification API endpoints ready
🔍 MODE: DEMO
```

---

## 5. Test Verification API Endpoints

### A. Send Verification Code

```bash
curl -X POST http://localhost:3000/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555551234",
    "language": "en"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 600
}
```

**Check Console:** You should see the 6-digit code printed in the server logs:
```
📱 Verification code generated for +15555551234: 123456 (expires in 10min)
```

---

### B. Verify Code

Use the code from the console output:

```bash
curl -X POST http://localhost:3000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555551234",
    "code": "123456"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

---

### C. Check Verification Status

```bash
curl http://localhost:3000/api/verification-status/%2B15555551234
```

**Expected Response:**
```json
{
  "success": true,
  "exists": true,
  "expired": false,
  "verified": true,
  "attemptsLeft": 3,
  "expiresIn": 543
}
```

---

### D. Test Rate Limiting

Try sending multiple codes rapidly:

```bash
# First request (should succeed)
curl -X POST http://localhost:3000/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555551234", "language": "en"}'

# Second request immediately after (should fail with 429)
curl -X POST http://localhost:3000/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555551234", "language": "en"}'
```

**Expected Response (2nd request):**
```json
{
  "success": false,
  "error": "Please wait 60 seconds before requesting another code",
  "retryAfter": 60
}
```

---

### E. Test Wrong Code (Attempts Tracking)

```bash
# Send a code
curl -X POST http://localhost:3000/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555559999", "language": "en"}'

# Try wrong code (Attempt 1)
curl -X POST http://localhost:3000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555559999", "code": "000000"}'

# Expected: "Invalid code. 2 attempts remaining."

# Try wrong code (Attempt 2)
curl -X POST http://localhost:3000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555559999", "code": "000000"}'

# Expected: "Invalid code. 1 attempt remaining."

# Try wrong code (Attempt 3)
curl -X POST http://localhost:3000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555559999", "code": "000000"}'

# Expected: "Too many failed attempts. Please request a new code."
```

---

### F. Test Code Expiration

```bash
# This test requires waiting 10 minutes or temporarily changing CODE_EXPIRY_MINUTES in verification.ts

# 1. Send code
curl -X POST http://localhost:3000/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555558888", "language": "en"}'

# 2. Wait 10+ minutes

# 3. Try to verify (should fail)
curl -X POST http://localhost:3000/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555558888", "code": "123456"}'

# Expected: "Code expired. Please request a new code."
```

---

## 6. Test Money Transfer Flow (All 9 Countries)

Testing the transfer flow requires WhatsApp webhook setup. For now, we can test the Wise API integration directly.

### Test Mexico Transfer

```bash
curl -X POST http://localhost:3000/test-transfer \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "recipientName": "Juan Perez",
    "recipientCountry": "Mexico",
    "targetCurrency": "MXN",
    "recipientBankAccount": "032180000118359719"
  }'
```

---

## 7. Test WhatsApp Webhook (Advanced)

To test the full WhatsApp bot flow, you need to:

### A. Install ngrok

```bash
brew install ngrok
# or download from https://ngrok.com/
```

### B. Start ngrok tunnel

```bash
ngrok http 3000
```

You'll get a URL like: `https://abc123.ngrok.io`

### C. Configure WhatsApp Webhook

1. Go to Meta for Developers: https://developers.facebook.com
2. Select your app
3. Go to WhatsApp > Configuration
4. Set Webhook URL: `https://abc123.ngrok.io/webhook`
5. Set Verify Token: `mybambu_secret_token_12345` (from .env)
6. Click "Verify and Save"

### D. Test WhatsApp Messages

Send messages to your WhatsApp Business number:

```
Test 1: "Send $100 to Mexico"
Expected: Bot asks for recipient name

Test 2: "Help"
Expected: Bot shows supported countries and examples

Test 3: "Enviar $50 a Colombia" (Spanish)
Expected: Bot responds in Spanish

Test 4: "How much is the fee?"
Expected: AI support answers the question
```

---

## 8. Check Server Logs

Watch the server logs for debugging:

```bash
npm start
```

Key log messages to look for:

```
✅ Success indicators:
- "📱 Verification code generated for..."
- "✅ Phone verified: ..."
- "Creating quote..."
- "Creating recipient..."
- "Creating transfer..."

❌ Error indicators:
- "❌ OpenAI Error: ..."
- "❌ Verification send error: ..."
- "Wise Quote Error: ..."
```

---

## 9. Testing Checklist

### Verification API Tests:
- [ ] Send verification code (English)
- [ ] Send verification code (Spanish)
- [ ] Verify correct code
- [ ] Verify wrong code (3 attempts)
- [ ] Rate limiting (60s cooldown)
- [ ] Rate limiting (3 codes/hour)
- [ ] Check verification status
- [ ] Code expiration (10 minutes)

### Phone Normalization Tests:
- [ ] "+15555551234" (standard)
- [ ] "15555551234" (missing +)
- [ ] "+1 555-555-1234" (with dashes)
- [ ] "+1 (555) 555-1234" (with parentheses)
- [ ] All formats should rate limit the same number

### Country Support Tests:
- [ ] Mexico (MXN) - CLABE
- [ ] Colombia (COP) - Account + ID
- [ ] Brazil (BRL) - Account + CPF
- [ ] Costa Rica (CRC) - IBAN + ID
- [ ] Uruguay (UYU) - Account + ID
- [ ] Argentina (ARS) - Account + Tax ID
- [ ] Chile (CLP) - Account + RUT
- [ ] UK (GBP) - Sort Code + Account
- [ ] Europe (EUR) - IBAN

---

## 10. Troubleshooting

### "Missing credentials. Please pass an `apiKey`"

**Problem:** OpenAI API key not set in `.env`

**Solution:** Add `OPENAI_API_KEY=your_key_here` to `.env` file

---

### "Error: EADDRINUSE: address already in use"

**Problem:** Port 3000 is already in use

**Solution:** Kill the existing process or change PORT in `.env`

```bash
# Find the process
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

---

### Verification codes not appearing

**Problem:** WhatsApp messages not sending in local mode

**Solution:** Check console logs for the verification code. In DEMO mode, the code is printed to console instead of sending via WhatsApp.

---

### "Wise recipient creation failed"

**Problem:** Invalid recipient details for the country

**Solution:** Check `src/services/recipient-fields.ts` for required fields for each country

---

## 11. Quick Test Script

Create a file `test-local.sh` for rapid testing:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
PHONE="+15555551234"

echo "=== Testing Verification API ==="

echo "\n1. Sending verification code..."
RESPONSE=$(curl -s -X POST $BASE_URL/api/send-verification \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\", \"language\": \"en\"}")
echo $RESPONSE

echo "\n2. Enter the code from console logs:"
read CODE

echo "\n3. Verifying code..."
curl -X POST $BASE_URL/api/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phoneNumber\": \"$PHONE\", \"code\": \"$CODE\"}"

echo "\n\n4. Checking status..."
curl "$BASE_URL/api/verification-status/$(echo $PHONE | jq -sRr @uri)"

echo "\n\n✅ Tests complete!"
```

Make it executable:
```bash
chmod +x test-local.sh
./test-local.sh
```

---

## 12. Production Deployment

Once all local tests pass:

```bash
# Commit your changes
git add .
git commit -m "Fix critical bugs and add local testing"

# Push to GitHub (Railway auto-deploys)
git push origin main

# Monitor Railway logs
railway logs
```

---

## Summary

This local testing setup allows you to:

1. Test all 4 verification API endpoints
2. Verify rate limiting and security features
3. Test phone number normalization
4. Validate all 9 country transfer flows
5. Debug issues before production deployment

**Total Testing Time:** ~30 minutes for complete validation

---

**Questions?** Check the server logs or review the code in:
- `src/services/verification.ts` - Verification logic
- `src/server.ts` - API endpoints and WhatsApp webhook
- `VERIFICATION-API.md` - Complete API documentation
