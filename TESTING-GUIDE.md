# 🧪 Testing Guide - AI Multi-lingual Bot

## Quick Test Checklist

Send messages to **+1 555 159 4893** on WhatsApp:

- [ ] English greeting works
- [ ] Spanish greeting works
- [ ] AI answers general questions (English)
- [ ] AI answers general questions (Spanish)
- [ ] English transfer flow works
- [ ] Spanish transfer flow works
- [ ] Phone number bug is fixed
- [ ] Spanish country names work

---

## Test 1: English Greeting

### Input:
```
Hello
```

### Expected Output:
```
👋 Welcome to MyBambu!

I help you send money internationally with great rates.

🌎 Supported countries:
• Mexico 🇲🇽
• Colombia 🇨🇴
• Brazil 🇧🇷
• United Kingdom 🇬🇧
• Europe 🇪🇺

Examples:
```Send $100 to Mexico```
```Transfer €50 to Colombia```
```Send £200 to Brazil```
```

✅ **Pass if:** Bot responds in English with formatted examples

---

## Test 2: Spanish Greeting

### Input:
```
Hola
```

### Expected Output:
```
👋 ¡Bienvenido a MyBambu!

Te ayudo a enviar dinero internacionalmente con excelentes tasas.

🌎 Países disponibles:
• México 🇲🇽
• Colombia 🇨🇴
• Brasil 🇧🇷
• Reino Unido 🇬🇧
• Europa 🇪🇺

Ejemplos:
```Enviar $100 a México```
```Transferir €50 a Colombia```
```Mandar £200 a Brasil```
```

✅ **Pass if:** Bot responds in Spanish with formatted examples

---

## Test 3: AI General Question (English)

### Input:
```
How does this work?
```

### Expected Output:
```
[AI responds naturally, something like:]

I help you send money internationally using Wise! Just tell me
the amount and destination country (Mexico, Colombia, Brazil,
UK, or Europe), and I'll guide you through providing the
recipient's details. To start, type something like:
*Send $100 to Mexico*
```

✅ **Pass if:**
- Bot responds conversationally
- Mentions key features
- Suggests how to start transfer
- Uses natural language (not rigid template)

---

## Test 4: AI General Question (Spanish)

### Setup:
First send "Hola" to set language to Spanish

### Input:
```
¿Cómo funciona esto?
```

### Expected Output:
```
[AI responds naturally in Spanish, something like:]

¡Te ayudo a enviar dinero internacionalmente con Wise! Solo
dime la cantidad y el país (México, Colombia, Brasil, Reino
Unido o Europa), y te guiaré paso a paso. Para empezar,
escribe algo como:
*Enviar $100 a México*
```

✅ **Pass if:**
- Bot responds in Spanish
- Natural conversation (not rigid)
- Explains service clearly
- Suggests transfer command

---

## Test 5: English Transfer Flow

### Input Sequence:
```
1. Send $100 to Mexico
2. John Smith
3. 032180000118359719
4. CONFIRM
```

### Expected Flow:
```
Step 1:
✅ Got it! Sending $100 USD to Mexico 🇲🇽

📝 What's the recipient's full name?

Step 2:
✅ Recipient: John Smith

📝 I need these details:
• CLABE: 18-digit bank account number
  Example: 032180000118359719

Step 3:
✅ Ready to Send!

💰 You send: $100 USD
💵 Fee: ~$3 USD
💱 Rate: 17.2 MXN/USD
📩 John Smith receives: ~1668.4 MXN
🌎 Country: Mexico

⏱️ Delivery: 1-2 business days

Type "CONFIRM" to send, or "cancel" to stop.

Step 4:
⏳ Processing your transfer...

[Wise API response or demo mode message]
```

✅ **Pass if:**
- All steps complete
- Amounts calculated correctly
- CLABE validated (18 digits)
- Confirmation works

---

## Test 6: Spanish Transfer Flow

### Input Sequence:
```
1. Hola
2. Enviar $100 a México
3. Maria Garcia
4. 032180000118359719
5. CONFIRM
```

### Expected Flow:
```
Step 1:
[Spanish greeting]

Step 2:
✅ ¡Entendido! Enviando $100 USD a Mexico 🇲🇽

📝 ¿Cuál es el nombre completo del destinatario?

Step 3:
✅ Recipient: Maria Garcia

📝 I need these details:
• CLABE: 18-digit bank account number
  Example: 032180000118359719

[Note: Bank detail prompts currently in English - could be enhanced]

Step 4:
032180000118359719

Step 5:
✅ Ready to Send!
[Confirmation details]

Step 6:
CONFIRM

[Transfer processing]
```

✅ **Pass if:**
- Spanish greeting works
- Transfer intent recognized ("Enviar")
- Country "México" recognized
- Flow completes successfully

---

## Test 7: Phone Number Bug Fix

### Setup:
Start Colombia transfer (requires phone number)

### Input Sequence:
```
1. Send $50 to Colombia
2. Juan Perez
3. Account: 1234567890
   Type: checking
   Cedula: 1234567890
   Phone: 3136379718
   Address: Calle 123
   City: Bogota
   Postal: 110111
```

### Expected Behavior:
```
Bot should extract phone number: "3136379718"

Should NOT show: "❌ Still need: Phone Number"
```

✅ **Pass if:**
- Phone number "3136379718" is extracted
- Bot doesn't ask for phone again
- Flow continues to next field

---

## Test 8: Spanish Country Names

### Test 8a: México
```
Input: Enviar $100 a México
Expected: ✅ Bot recognizes "México" as Mexico
```

### Test 8b: Brasil
```
Input: Enviar $50 a Brasil
Expected: ✅ Bot recognizes "Brasil" as Brazil
```

### Test 8c: Reino Unido
```
Input: Enviar $200 a Reino Unido
Expected: ✅ Bot recognizes "Reino Unido" as United Kingdom
```

✅ **Pass if:** All three Spanish country names work

---

## Test 9: Help Command (Multi-lingual)

### English:
```
Input: help

Expected:
💡 MyBambu Help

I can help you send money to:
• Mexico 🇲🇽
• Colombia 🇨🇴
• Brazil 🇧🇷
• United Kingdom 🇬🇧
• Europe 🇪🇺

Try:
• "Send $100 to Mexico"
• "What's the rate to Colombia?"
• "Send money to my family"

Say "cancel" anytime to stop.
```

### Spanish:
```
Input: ayuda

Expected:
💡 Ayuda de MyBambu

Puedo ayudarte a enviar dinero a:
• México 🇲🇽
• Colombia 🇨🇴
• Brasil 🇧🇷
• Reino Unido 🇬🇧
• Europa 🇪🇺

Prueba:
• "Enviar $100 a México"
• "¿Cuál es la tasa para Colombia?"
• "Enviar dinero a mi familia"

Escribe "cancelar" en cualquier momento.
```

✅ **Pass if:** Both commands work in respective languages

---

## Test 10: Cancel Command (Multi-lingual)

### Setup:
Start any transfer flow

### English Cancel:
```
Input: cancel
Expected: 🔄 Transfer cancelled. Say "hello" to start again.
```

### Spanish Cancel:
```
Input: cancelar
Expected: 🔄 Transferencia cancelada. Escribe "hola" para empezar de nuevo.
```

✅ **Pass if:** Both cancel commands work

---

## Test 11: AI Edge Cases

### Test 11a: Unrecognized Input
```
Input: What is the meaning of life?

Expected: [AI responds conversationally, then suggests transfer commands]
```

### Test 11b: Rate Question
```
Input: What's the rate to Colombia?

Expected: [AI explains current rates or suggests starting transfer to see real rates]
```

### Test 11c: Delivery Time Question
```
Input: How long does it take?

Expected: [AI explains delivery times for different countries]
```

✅ **Pass if:** AI handles gracefully and redirects to transfer

---

## Test 12: Error Handling

### Test 12a: Invalid Amount
```
Input: Send $0 to Mexico
Expected: ❌ Please enter a valid amount between $1 and $10,000
```

### Test 12b: Unsupported Country
```
Input: Send $100 to Japan
Expected: [AI explains only 5 countries supported, lists them]
```

### Test 12c: Invalid CLABE (Mexico)
```
Input: Send $100 to Mexico
       John Smith
       123456  [only 6 digits, needs 18]

Expected: ❌ Still need: CLABE
          Please provide the missing information.
```

✅ **Pass if:** All validation errors show correctly

---

## Test 13: Railway Logs Check

### Command:
```bash
railway logs --follow
```

### Look For:

**Language Detection:**
```
🌐 Language detected for +15551594893: es
```

**AI Fallback:**
```
🤖 Using AI fallback for: "How does this work?"
```

**Message Handling:**
```
📱 +15551594893 [idle] [en]: Hello
```

**Errors (should NOT see):**
```
❌ OpenAI Error: [any error]
```

✅ **Pass if:** Logs show language detection and AI working

---

## Test 14: Health Check

### Command:
```bash
curl https://mybambu-whatsapp-production-aff2.up.railway.app/health
```

### Expected Response:
```json
{
  "status": "ok",
  "mode": "PRODUCTION",
  "wiseConnected": false,
  "whatsappConfigured": true
}
```

✅ **Pass if:** Status is "ok" and mode is "PRODUCTION"

---

## Pass/Fail Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. English Greeting | ⬜ | |
| 2. Spanish Greeting | ⬜ | |
| 3. AI Question (EN) | ⬜ | |
| 4. AI Question (ES) | ⬜ | |
| 5. English Transfer | ⬜ | |
| 6. Spanish Transfer | ⬜ | |
| 7. Phone Bug Fix | ⬜ | |
| 8. Spanish Countries | ⬜ | |
| 9. Help Command | ⬜ | |
| 10. Cancel Command | ⬜ | |
| 11. AI Edge Cases | ⬜ | |
| 12. Error Handling | ⬜ | |
| 13. Railway Logs | ⬜ | |
| 14. Health Check | ⬜ | |

---

## Quick Smoke Test (5 minutes)

Minimal tests to verify everything works:

1. **English:** "Hello" → "Send $100 to Mexico" → [complete flow]
2. **Spanish:** "Hola" → "Enviar $100 a México" → [complete flow]
3. **AI:** "How does this work?" → [check natural response]
4. **Phone:** [Colombia transfer] → "Phone: 3136379718" → [verify extraction]

If all 4 pass → ✅ **Ready for production!**

---

## Troubleshooting

### Issue: AI not responding
**Check:**
- Is `OPENAI_API_KEY` set in Railway?
- Railway logs show OpenAI errors?
- Internet connection working?

**Fix:**
- Add environment variable in Railway
- Check API key is valid
- Restart Railway service

### Issue: Wrong language
**Fix:**
- Type "cancel" to reset
- Send greeting in desired language first ("Hello" or "Hola")
- Language detected from first message

### Issue: Phone still not working
**Check:**
- Did you deploy latest code?
- Railway logs show updated version?
- Try format: "Phone: 1234567890" or "phoneNumber: 1234567890"

**Fix:**
- Push code: `git push origin main`
- Wait for Railway redeploy
- Check commit deployed successfully

---

## Success! 🎉

If all tests pass, your bot is:
- ✅ AI-powered
- ✅ Multi-lingual
- ✅ Bug-free
- ✅ Production-ready

**Ready to launch!** 🚀
