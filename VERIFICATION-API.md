# 🔐 MyBambu Phone Verification API

Complete API documentation for phone verification via WhatsApp.

## Overview

This API allows you to send verification codes to users via WhatsApp and verify them. Perfect for phone number verification during user registration.

**Base URL:** `https://your-app.railway.app` (or your deployment URL)

---

## 🚀 Quick Start

### 1. Send Verification Code

```bash
curl -X POST https://your-app.railway.app/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555551234",
    "language": "en"
  }'
```

### 2. User Receives WhatsApp Message

```
🔐 MyBambu Phone Verification

Your verification code is:

123456

⏱️ This code expires in 10 minutes.

🔒 Never share this code with anyone, including MyBambu staff.
```

### 3. Verify the Code

```bash
curl -X POST https://your-app.railway.app/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15555551234",
    "code": "123456"
  }'
```

---

## 📡 API Endpoints

### POST /api/send-verification

Send a verification code to a phone number via WhatsApp.

**Request Body:**
```json
{
  "phoneNumber": "+15555551234",  // Required: E.164 format
  "language": "en"                 // Optional: "en" or "es" (default: "en")
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Verification code sent",
  "expiresIn": 600  // seconds (10 minutes)
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Phone number is required"
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": "Please wait 45 seconds before requesting another code",
  "retryAfter": 45  // seconds
}
```

**Rate Limits:**
- 60-second cooldown between requests
- Maximum 3 requests per hour per phone number

---

### POST /api/verify-code

Verify a code for a phone number.

**Request Body:**
```json
{
  "phoneNumber": "+15555551234",  // Required
  "code": "123456"                // Required: 6-digit code
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

**Error Responses:**

**400 Bad Request - Invalid Code:**
```json
{
  "success": false,
  "error": "Invalid code. 2 attempts remaining.",
  "attemptsLeft": 2
}
```

**400 Bad Request - Code Expired:**
```json
{
  "success": false,
  "error": "Code expired. Please request a new code."
}
```

**400 Bad Request - Too Many Attempts:**
```json
{
  "success": false,
  "error": "Too many failed attempts. Please request a new code."
}
```

**Validation Rules:**
- Maximum 3 verification attempts per code
- Code expires after 10 minutes
- Code can only be used once

---

### GET /api/verification-status/:phoneNumber

Check the verification status for a phone number.

**URL Parameters:**
- `phoneNumber` - Phone number to check (URL encoded)

**Example:**
```bash
curl https://your-app.railway.app/api/verification-status/%2B15555551234
```

**Success Response (200):**
```json
{
  "success": true,
  "exists": true,
  "expired": false,
  "verified": false,
  "attemptsLeft": 3,
  "expiresIn": 543  // seconds
}
```

**If No Code Exists:**
```json
{
  "success": true,
  "exists": false
}
```

---

### POST /api/resend-verification

Resend a verification code (alias for `/api/send-verification`).

Same behavior as `POST /api/send-verification`.

---

## 🔒 Security Features

### Rate Limiting
- **60-second cooldown:** Users must wait 60 seconds between code requests
- **3 codes per hour:** Maximum 3 verification codes per phone number per hour
- **3 attempts per code:** Maximum 3 verification attempts per code

### Code Expiration
- Codes expire after **10 minutes**
- Expired codes are automatically cleaned up every 5 minutes

### Validation
- Phone numbers are normalized (spaces, dashes, parentheses removed)
- Codes are 6 digits for easy entry
- Single-use codes (cannot be verified twice)

---

## 📱 Phone Number Format

**Recommended Format:** E.164 (international format)

✅ **Good:**
- `+15555551234` (US)
- `+34612345678` (Spain)
- `+52155123456` (Mexico)
- `+573001234567` (Colombia)

⚠️ **Acceptable (will be normalized):**
- `+1 555-555-1234`
- `+1 (555) 555-1234`
- `15555551234` (missing +)

❌ **Bad:**
- `5555551234` (missing country code)
- `555-1234` (incomplete)

---

## 🌍 Language Support

The API supports bilingual verification messages:

### English (`"language": "en"`)
```
🔐 MyBambu Phone Verification

Your verification code is:

123456

⏱️ This code expires in 10 minutes.

🔒 Never share this code with anyone, including MyBambu staff.

If you didn't request this code, please ignore this message.
```

### Spanish (`"language": "es"`)
```
🔐 Verificación de Teléfono MyBambu

Tu código de verificación es:

123456

⏱️ Este código expira en 10 minutos.

🔒 Nunca compartas este código con nadie, incluyendo el personal de MyBambu.

Si no solicitaste este código, por favor ignora este mensaje.
```

---

## 💻 Integration Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Send verification code
async function sendVerificationCode(phoneNumber: string, language = 'en') {
  const response = await fetch('https://your-app.railway.app/api/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, language })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data;
}

// Verify code
async function verifyCode(phoneNumber: string, code: string) {
  const response = await fetch('https://your-app.railway.app/api/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data;
}

// Usage in registration flow
async function registerUser(phoneNumber: string, verificationCode: string) {
  try {
    // Step 1: Verify the code
    await verifyCode(phoneNumber, verificationCode);

    // Step 2: Create user account
    // ... your user creation logic

    console.log('✅ User registered successfully!');
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}
```

### React Example (with State Management)

```tsx
import { useState } from 'react';

function PhoneVerification() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://your-app.railway.app/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          language: navigator.language.startsWith('es') ? 'es' : 'en'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setStep('code');
      alert('Verification code sent to your WhatsApp!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://your-app.railway.app/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, code })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      alert('✅ Phone verified! Creating your account...');
      // Proceed with registration
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 'phone' ? (
        <div>
          <h2>Enter Your Phone Number</h2>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1 555-555-1234"
          />
          <button onClick={sendCode} disabled={loading}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Enter Verification Code</h2>
          <p>Check your WhatsApp messages</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
          />
          <button onClick={verifyCode} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button onClick={sendCode}>Resend Code</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Python Example

```python
import requests

def send_verification_code(phone_number: str, language: str = 'en') -> dict:
    """Send verification code via WhatsApp"""
    response = requests.post(
        'https://your-app.railway.app/api/send-verification',
        json={'phoneNumber': phone_number, 'language': language}
    )
    return response.json()

def verify_code(phone_number: str, code: str) -> dict:
    """Verify the code"""
    response = requests.post(
        'https://your-app.railway.app/api/verify-code',
        json={'phoneNumber': phone_number, 'code': code}
    )
    return response.json()

# Usage
phone = '+15555551234'

# Send code
result = send_verification_code(phone, language='es')
print(f"Code sent! Expires in {result['expiresIn']} seconds")

# User enters code from WhatsApp
user_code = input("Enter verification code: ")

# Verify
result = verify_code(phone, user_code)
if result['success']:
    print("✅ Phone verified!")
else:
    print(f"❌ Error: {result['error']}")
```

---

## 🧪 Testing

### Manual Testing with cURL

```bash
# 1. Send verification code
curl -X POST https://your-app.railway.app/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555551234", "language": "en"}'

# 2. Check WhatsApp for the code

# 3. Verify the code
curl -X POST https://your-app.railway.app/api/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555551234", "code": "123456"}'

# 4. Check status
curl https://your-app.railway.app/api/verification-status/%2B15555551234
```

### Testing Rate Limits

```bash
# Send 3 codes rapidly (should work)
for i in {1..3}; do
  curl -X POST https://your-app.railway.app/api/send-verification \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber": "+15555551234"}'
  sleep 61  # Wait 61 seconds between requests
done

# 4th request within an hour should fail with 429
curl -X POST https://your-app.railway.app/api/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15555551234"}'
```

---

## ⚠️ Error Handling Best Practices

```typescript
async function sendCodeWithRetry(phoneNumber: string) {
  try {
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber })
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = data.retryAfter || 60;
      alert(`Please wait ${retryAfter} seconds before trying again`);
      return;
    }

    // Handle other errors
    if (!data.success) {
      alert(`Error: ${data.error}`);
      return;
    }

    // Success
    alert('Verification code sent!');

  } catch (error) {
    alert('Network error. Please check your connection.');
  }
}
```

---

## 🔧 Production Recommendations

### 1. Use HTTPS
Always use HTTPS in production to protect user data.

### 2. Store Verification Status
After successful verification, store it in your database:
```sql
CREATE TABLE verified_phones (
  phone_number VARCHAR(20) PRIMARY KEY,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

### 3. Monitor Usage
Track verification metrics:
- Success rate
- Average time to verify
- Failed attempts
- Rate limit hits

### 4. Fraud Prevention
- Implement device fingerprinting
- Track IP addresses
- Limit verifications per device
- Add CAPTCHA for suspicious patterns

### 5. Use Redis for Multi-Instance
For production with multiple instances, replace in-memory storage with Redis:
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store code
await redis.setex(`verification:${phoneNumber}`, 600, JSON.stringify(codeData));

// Get code
const data = await redis.get(`verification:${phoneNumber}`);
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Verification Success Rate**
   ```
   (Successful Verifications / Total Codes Sent) * 100
   ```

2. **Average Time to Verify**
   ```
   Time between code sent and successful verification
   ```

3. **Failed Attempt Rate**
   ```
   (Failed Attempts / Total Verification Attempts) * 100
   ```

4. **Rate Limit Hits**
   ```
   Number of 429 responses
   ```

---

## 🎯 Use Cases

### User Registration
```
1. User enters phone number in app
2. App calls /api/send-verification
3. User receives WhatsApp message
4. User enters code in app
5. App calls /api/verify-code
6. Upon success, create user account
```

### Two-Factor Authentication (2FA)
```
1. User logs in with email/password
2. System sends verification code
3. User enters code from WhatsApp
4. Upon verification, grant access
```

### Phone Number Change
```
1. User requests to change phone number
2. Send code to NEW phone number
3. User verifies new number
4. Update user's phone in database
```

---

## 🚨 Troubleshooting

### Code Not Received
1. Check phone number format (must include country code)
2. Verify WhatsApp is configured correctly
3. Check Railway logs for errors
4. Ensure phone number has WhatsApp installed

### "Too Many Requests" Error
- User hit rate limit (3 codes per hour)
- Solution: Wait for the retry period shown in error

### "Code Expired" Error
- Code was valid for 10 minutes
- Solution: Request a new code

### "Invalid Code" Error
- User entered wrong code
- Check remaining attempts
- After 3 failed attempts, request new code

---

## 📞 Support

For issues or questions:
1. Check Railway logs: `railway logs`
2. Check GitHub issues
3. Review this documentation

---

**Built with ❤️ by MyBambu**
