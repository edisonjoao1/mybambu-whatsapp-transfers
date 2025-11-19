# Parsing Bug Fix - Implementation Guide

## Quick Fix Summary

**Status:** ✅ Already fixed in current codebase
**File:** `/src/server.ts`
**Lines:** 516-574
**Commit:** Fixed in `1d23123` (CRITICAL FIXES: Production-ready security and stability improvements)

---

## If You Need to Apply This Fix Manually

### Step 1: Locate the Bug

**File:** `src/server.ts`
**Function:** `handleCollectingBankDetails()`
**Look for:** Comment saying `// Simple extraction (in production, use better NLP)`

### Step 2: Replace the Old Code

#### ❌ OLD CODE (BUGGY):
```typescript
// Parse bank details from message
const details = session.bankDetails || {};

// Simple extraction (in production, use better NLP)
for (const field of requirements.fields) {
  // Check if field name or label appears in text
  const fieldPattern = new RegExp(`(?:${field.name}|${field.label})\\s*:?\\s*([\\w\\s\\-]+)`, 'i');
  const match = text.match(fieldPattern);
  if (match && !details[field.name]) {
    details[field.name] = match[1].trim();
  }
}
```

#### ✅ NEW CODE (FIXED):
```typescript
// Parse bank details from message
const details = session.bankDetails || {};

// Build comprehensive field patterns including aliases
for (const field of requirements.fields) {
  // Skip if already captured
  if (details[field.name]) continue;

  // Build list of all possible field identifiers (name, label, and aliases)
  const identifiers = [field.name, field.label];
  if (field.aliases) {
    identifiers.push(...field.aliases);
  }

  // Try each identifier
  for (const identifier of identifiers) {
    // Escape special regex characters in identifier
    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Match pattern: "Field name: value" where value stops at:
    // - A dash surrounded by whitespace (field separator like " - ")
    // - A newline followed by capital letter (next field on new line)
    // - End of string
    // This preserves internal hyphens (like "45-47") but stops at separator dashes
    const fieldPattern = new RegExp(
      `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)`,
      'i'
    );

    const match = text.match(fieldPattern);
    if (match) {
      // Clean the captured value:
      // 1. Trim all whitespace
      // 2. Remove trailing dashes and spaces
      // 3. Remove trailing punctuation
      let value = match[1].trim();
      value = value.replace(/[\s\-]+$/, ''); // Remove trailing spaces and dashes
      value = value.replace(/[,;]+$/, ''); // Remove trailing punctuation

      if (value) {
        details[field.name] = value;
        console.log(`✅ Extracted ${field.name}: "${value}" (matched on "${identifier}")`);
        break; // Found a match, move to next field
      }
    }
  }
}
```

### Step 3: Update Field Definitions (Add Aliases)

**File:** `src/services/recipient-fields.ts`
**Add:** `aliases` property to `BankFieldRequirement` interface

#### Update the Interface:
```typescript
export interface BankFieldRequirement {
  name: string;
  label: string;
  description: string;
  required: boolean;
  example: string;
  aliases?: string[];  // ← ADD THIS LINE
}
```

#### Add Aliases to Colombia Fields:
```typescript
'COP': {
  country: 'Colombia',
  currency: 'COP',
  accountType: 'colombia',
  fields: [
    {
      name: 'accountNumber',
      label: 'Account Number',
      description: 'Bank account number (4-20 characters)',
      required: true,
      example: '00012345678',
      aliases: ['Bank account number', 'Account number', 'Account']
    },
    {
      name: 'accountType',
      label: 'Account Type',
      description: 'CURRENT (checking) or SAVINGS',
      required: true,
      example: 'SAVINGS',
      aliases: ['Account type', 'Type', 'Tipo de cuenta']
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      description: 'Colombian phone number (7-20 digits)',
      required: true,
      example: '3001234567',
      aliases: ['Phone', 'Phone number', 'Teléfono', 'Telefono']
    },
    {
      name: 'idDocumentNumber',
      label: 'Cédula Number',
      description: 'Colombian national ID number (Cédula de Ciudadanía)',
      required: true,
      example: '1234567890',
      aliases: ['Cédula', 'Cedula', 'Cédula number', 'Cedula number', 'ID', 'CC']
    },
    {
      name: 'city',
      label: 'City',
      description: 'City where recipient lives',
      required: true,
      example: 'Bogotá',
      aliases: ['City', 'Ciudad']
    },
    {
      name: 'address',
      label: 'Street Address',
      description: 'Recipient\'s street address',
      required: true,
      example: 'Calle 123 #45-67',
      aliases: ['Address', 'Street address', 'Dirección', 'Direccion']
    },
    {
      name: 'postCode',
      label: 'Post Code',
      description: 'Postal code',
      required: true,
      example: '110111',
      aliases: ['Post code', 'Postcode', 'Postal code', 'Zip code', 'Zip', 'Código postal', 'Codigo postal']
    }
  ],
  instructions: '...'
}
```

### Step 4: Rebuild and Deploy

```bash
# Clean old build
rm -rf dist/

# Rebuild TypeScript
npm run build

# Restart server (local)
npm start

# Or redeploy to your hosting platform
# Example for Railway:
git add .
git commit -m "Fix parsing bug for bank details"
git push

# Example for Vercel:
vercel --prod
```

---

## Testing the Fix

### Test Input:
```
Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111
```

### Expected Output (in server logs):
```
✅ Extracted accountNumber: "78800058952" (matched on "Bank account number")
✅ Extracted accountType: "SAVINGS" (matched on "Account type")
✅ Extracted phoneNumber: "3136379718" (matched on "Phone")
✅ Extracted idDocumentNumber: "1235039039" (matched on "Cédula number")
✅ Extracted address: "Calle 110 #45-47" (matched on "Address")
✅ Extracted city: "Bogota" (matched on "City")
✅ Extracted postCode: "110111" (matched on "Post code")
```

### Run Test Suite:
```bash
# Test the fix with exact user input
npx tsx test-parser-bug.ts

# Expected output:
# 🎉 ALL TESTS PASSED!
```

---

## Understanding the Fix

### What Changed:

| Aspect | Before | After |
|--------|--------|-------|
| **Regex Pattern** | `([\\w\\s\\-]+)` | `([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)` |
| **Character Matching** | Word chars, whitespace, dashes | Anything except colons and newlines |
| **Quantifier** | Greedy `+` | Non-greedy `+?` |
| **Boundary Detection** | None | Lookahead for field separators |
| **Alias Support** | No | Yes |
| **Post-Processing** | Just `.trim()` | Removes trailing spaces, dashes, punctuation |

### Key Improvements:

1. **Stops at Field Boundaries:**
   - Old: Kept matching across ` - ` separators
   - New: Lookahead `(?=\\s+-\\s+[A-Z])` stops before separator

2. **Excludes Newlines:**
   - Old: `\\s` included newlines, jumped to next line
   - New: `[^:\\n]` explicitly excludes newlines

3. **Non-Greedy Matching:**
   - Old: `+` matched as much as possible
   - New: `+?` matches as little as possible, stops at first boundary

4. **Preserves Internal Dashes:**
   - Input: `"Address: Calle 110 #45-47"`
   - Output: `"Calle 110 #45-47"` ✅ (dash preserved)
   - Stops at: `"   - City"` (separator dash)

5. **Alias Support:**
   - Matches multiple field identifiers
   - Example: "Phone" matches both "Phone:" and "Phone Number:"

---

## Regex Breakdown

### New Pattern:
```regex
(?:Account Number)\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)
```

| Part | Explanation |
|------|-------------|
| `(?:Account Number)` | Non-capturing group for field identifier |
| `\\s*` | Zero or more whitespace |
| `:?` | Optional colon |
| `\\s*` | Zero or more whitespace |
| `(` | **Start capture group** |
| `[^:\\n]` | Match anything EXCEPT colons and newlines |
| `+?` | One or more times (non-greedy) |
| `)` | **End capture group** |
| `(?=` | **Start lookahead** (doesn't consume) |
| `\\s+-\\s+[A-Z]` | Space(s) + dash + space(s) + capital letter |
| `|` | OR |
| `\\n[A-Z]` | Newline + capital letter |
| `|` | OR |
| `$` | End of string |
| `)` | **End lookahead** |

---

## Troubleshooting

### Issue: Still seeing old errors

**Solutions:**
1. Check if you're running the latest code: `git log --oneline -1`
2. Rebuild: `rm -rf dist/ && npm run build`
3. Restart server: `npm start` or redeploy
4. Clear any CDN/proxy caches

### Issue: Some fields not extracted

**Check:**
1. Field aliases defined in `recipient-fields.ts`
2. User input format matches expected patterns
3. Server logs show extraction attempts
4. Console logs: `console.log('Raw input:', text);`

### Issue: Extracting wrong values

**Debug:**
1. Add logging: `console.log('Testing identifier:', identifier)`
2. Check escaped identifier: `console.log('Escaped:', escapedIdentifier)`
3. Test regex separately: `console.log('Match:', text.match(fieldPattern))`

---

## Alternative Simpler Regex (Optional)

If you want a simpler regex that doesn't use lookaheads:

```typescript
// Simpler alternative (but doesn't preserve internal dashes as well)
const fieldPattern = new RegExp(
  `${escapedIdentifier}\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`,
  'i'
);
```

**Trade-offs:**
- ✅ Simpler, easier to understand
- ❌ Stops at ALL dashes (including "45-47")
- ❌ Requires more cleanup

---

## Files Modified

1. ✅ `/src/server.ts` (lines 516-574)
2. ✅ `/src/services/recipient-fields.ts` (add aliases)

## Files to Test

1. `test-parser-bug.ts` - Comprehensive test
2. `test-current-regex.ts` - Regex analysis
3. `test-wise-extraction.ts` - Wise API simulation

---

**Generated:** 2025-11-19
