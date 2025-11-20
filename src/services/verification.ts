/**
 * Phone Verification Service
 * Handles verification code generation, storage, and validation
 */

interface VerificationCode {
  code: string;
  phoneNumber: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// In-memory storage (use Redis in production for multi-instance support)
const verificationCodes = new Map<string, VerificationCode>();

// Configuration
const CODE_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const MAX_RESENDS_PER_HOUR = 3;
const RESEND_COOLDOWN_SECONDS = 60;

// Track resend attempts per phone number
const resendAttempts = new Map<string, { count: number; resetAt: Date }>();
const lastSendTime = new Map<string, Date>();

/**
 * Generate a 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store a verification code for a phone number
 */
export function storeVerificationCode(phoneNumber: string): VerificationCode {
  const code = generateVerificationCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CODE_EXPIRY_MINUTES * 60 * 1000);

  const verificationCode: VerificationCode = {
    code,
    phoneNumber,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false
  };

  verificationCodes.set(phoneNumber, verificationCode);

  console.log(`📱 Verification code generated for ${phoneNumber}: ${code} (expires in ${CODE_EXPIRY_MINUTES}min)`);

  return verificationCode;
}

/**
 * Check if user can request a new code (rate limiting)
 */
export function canRequestVerification(phoneNumber: string): { allowed: boolean; reason?: string; retryAfter?: number } {
  // Check resend cooldown (60 seconds between requests)
  const lastSent = lastSendTime.get(phoneNumber);
  if (lastSent) {
    const secondsSinceLastSend = (Date.now() - lastSent.getTime()) / 1000;
    if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
      const retryAfter = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLastSend);
      return {
        allowed: false,
        reason: `Please wait ${retryAfter} seconds before requesting another code`,
        retryAfter
      };
    }
  }

  // Check hourly resend limit
  const resendData = resendAttempts.get(phoneNumber);
  const now = new Date();

  if (resendData) {
    // Reset counter if hour has passed
    if (now >= resendData.resetAt) {
      resendAttempts.delete(phoneNumber);
    } else if (resendData.count >= MAX_RESENDS_PER_HOUR) {
      const minutesUntilReset = Math.ceil((resendData.resetAt.getTime() - now.getTime()) / 60000);
      return {
        allowed: false,
        reason: `Too many requests. Try again in ${minutesUntilReset} minutes`,
        retryAfter: minutesUntilReset * 60
      };
    }
  }

  return { allowed: true };
}

/**
 * Record that a verification code was sent
 */
export function recordVerificationSent(phoneNumber: string): void {
  lastSendTime.set(phoneNumber, new Date());

  const now = new Date();
  const resendData = resendAttempts.get(phoneNumber);

  if (resendData && now < resendData.resetAt) {
    resendData.count++;
  } else {
    const resetAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    resendAttempts.set(phoneNumber, { count: 1, resetAt });
  }
}

/**
 * Verify a code for a phone number
 */
export function verifyCode(phoneNumber: string, code: string): {
  valid: boolean;
  reason?: string;
  attemptsLeft?: number
} {
  const storedCode = verificationCodes.get(phoneNumber);

  if (!storedCode) {
    return {
      valid: false,
      reason: 'No verification code found. Please request a new code.'
    };
  }

  // Check expiration
  if (new Date() > storedCode.expiresAt) {
    verificationCodes.delete(phoneNumber);
    return {
      valid: false,
      reason: 'Code expired. Please request a new code.'
    };
  }

  // Check if already verified
  if (storedCode.verified) {
    return {
      valid: false,
      reason: 'Code already used. Please request a new code.'
    };
  }

  // Increment attempts
  storedCode.attempts++;

  // Check max attempts
  if (storedCode.attempts > MAX_ATTEMPTS) {
    verificationCodes.delete(phoneNumber);
    return {
      valid: false,
      reason: 'Too many failed attempts. Please request a new code.'
    };
  }

  // Verify code
  if (storedCode.code === code) {
    storedCode.verified = true;
    console.log(`✅ Phone verified: ${phoneNumber}`);

    // Clean up after 5 minutes (allow time for app to process)
    setTimeout(() => {
      verificationCodes.delete(phoneNumber);
    }, 5 * 60 * 1000);

    return { valid: true };
  }

  const attemptsLeft = MAX_ATTEMPTS - storedCode.attempts;
  return {
    valid: false,
    reason: `Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
    attemptsLeft
  };
}

/**
 * Get verification status for a phone number
 */
export function getVerificationStatus(phoneNumber: string): {
  exists: boolean;
  expired?: boolean;
  verified?: boolean;
  attemptsLeft?: number;
  expiresIn?: number;
} {
  const storedCode = verificationCodes.get(phoneNumber);

  if (!storedCode) {
    return { exists: false };
  }

  const now = new Date();
  const expired = now > storedCode.expiresAt;
  const expiresIn = expired ? 0 : Math.ceil((storedCode.expiresAt.getTime() - now.getTime()) / 1000);
  const attemptsLeft = MAX_ATTEMPTS - storedCode.attempts;

  return {
    exists: true,
    expired,
    verified: storedCode.verified,
    attemptsLeft,
    expiresIn
  };
}

/**
 * Clean up expired codes (run periodically)
 */
export function cleanupExpiredCodes(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [phoneNumber, code] of verificationCodes.entries()) {
    if (now > code.expiresAt) {
      verificationCodes.delete(phoneNumber);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired verification code(s)`);
  }

  return cleaned;
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);

/**
 * Format verification message in English
 */
export function formatVerificationMessageEnglish(code: string): string {
  return `🔐 *MyBambu Phone Verification*\n\n` +
    `Your verification code is:\n\n` +
    `*${code}*\n\n` +
    `⏱️ This code expires in ${CODE_EXPIRY_MINUTES} minutes.\n\n` +
    `🔒 Never share this code with anyone, including MyBambu staff.\n\n` +
    `If you didn't request this code, please ignore this message.`;
}

/**
 * Format verification message in Spanish
 */
export function formatVerificationMessageSpanish(code: string): string {
  return `🔐 *Verificación de Teléfono MyBambu*\n\n` +
    `Tu código de verificación es:\n\n` +
    `*${code}*\n\n` +
    `⏱️ Este código expira en ${CODE_EXPIRY_MINUTES} minutos.\n\n` +
    `🔒 Nunca compartas este código con nadie, incluyendo el personal de MyBambu.\n\n` +
    `Si no solicitaste este código, por favor ignora este mensaje.`;
}
