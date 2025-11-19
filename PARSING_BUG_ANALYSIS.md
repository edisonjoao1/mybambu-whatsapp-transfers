# Parsing Bug Analysis - WhatsApp Bot Bank Details Extraction

## Executive Summary

**Status:** ✅ **ALREADY FIXED** in current codebase (but may need deployment)

The parsing bug described in the user's report has already been fixed in the current codebase. The issue was in commit `41b35e3` (initial commit) and was fixed in commit `1d23123` (security fixes).

---

## The Original Bug

### User's Input (All At Once):
```
Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111
```

### Wise API Errors (From User's Report):
```json
[
  {
    "code": "NOT_VALID",
    "message": "Please enter a valid account number.",
    "path": "accountNumber",
    "arguments": ["accountNumber", "78800058952-Accounttype"]
  },
  {
    "code": "NOT_VALID",
    "message": "Please select a valid account type.",
    "path": "accountType",
    "arguments": ["accountType", "SAVINGS   -  \nPHONE"]
  },
  {
    "code": "NOT_VALID",
    "message": "Entered ID number is not valid",
    "path": "idDocumentNumber",
    "arguments": ["idDocumentNumber", "1235039039   - Address"]
  }
]
```

### What Was Being Extracted (OLD CODE):
- ❌ Account number: `"78800058952-Accounttype"` (should be `"78800058952"`)
- ❌ Account type: `"SAVINGS   -  \nPHONE"` (should be `"SAVINGS"`)
- ❌ ID number: `"1235039039   - Address"` (should be `"1235039039"`)

---

## Root Cause Analysis

### Original Buggy Regex (Commit 41b35e3):
**Location:** `/src/server.ts` lines 527-534

```typescript
for (const field of requirements.fields) {
  // Check if field name or label appears in text
  const fieldPattern = new RegExp(`(?:${field.name}|${field.label})\\s*:?\\s*([\\w\\s\\-]+)`, 'i');
  const match = text.match(fieldPattern);
  if (match && !details[field.name]) {
    details[field.name] = match[1].trim();
  }
}
```

### Problem with the Pattern: `([\\w\\s\\-]+)`

This pattern uses a **greedy quantifier** `+` that matches:
- `\\w` - Word characters (letters, digits, underscore)
- `\\s` - Whitespace (spaces, tabs, newlines)
- `\\-` - Hyphens/dashes

**Why It Failed:**
1. **Too Greedy:** Matches continue across field separators (` - `)
2. **No Stop Condition:** Doesn't know when to stop at field boundaries
3. **Captures Too Much:** Includes trailing dashes, spaces, and even next field names

### Example Breakdown:

For input: `"Account number: 78800058952   -\nAccount type: SAVINGS"`

The regex `Account number\\s*:?\\s*([\\w\\s\\-]+)` would match:
- ✅ `"Account number: "` (field identifier)
- ❌ `"78800058952   -\nAccount type"` (captures too much!)

Why? Because `[\\w\\s\\-]+` matches:
- `78800058952` ✅ (digits)
- `   ` ✅ (spaces)
- `-` ✅ (dash)
- `\n` ✅ (newline = whitespace)
- `Account` ✅ (word characters)
- ` ` ✅ (space)
- `type` ✅ (word characters)

---

## The Fix (Already Implemented)

### Current Fixed Regex (Commit 1d23123):
**Location:** `/src/server.ts` lines 528-570

```typescript
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

### Key Improvements:

#### 1. **Lookahead Assertion:** `(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)`
   - Stops BEFORE field separators: ` - [Capital]`
   - Stops BEFORE newline + capital letter: `\n[A-Z]`
   - Stops at end of string: `$`
   - **Doesn't consume** the lookahead content (zero-width)

#### 2. **Non-Greedy Match:** `([^:\\n]+?)`
   - `[^:\\n]` - Matches anything EXCEPT colons and newlines
   - `+?` - Non-greedy quantifier (stops at first lookahead match)

#### 3. **Alias Support:**
   - Matches multiple field identifiers: `field.name`, `field.label`, and `field.aliases[]`
   - Examples:
     - "Account Number" → matches "Account number", "Bank account number", "Account"
     - "Phone Number" → matches "Phone", "Phone number", "Teléfono"
     - "Cédula Number" → matches "Cédula", "Cedula", "CC", "ID"

#### 4. **Post-Processing Cleanup:**
   ```typescript
   value = value.replace(/[\s\-]+$/, '');  // Remove trailing spaces/dashes
   value = value.replace(/[,;]+$/, '');     // Remove trailing punctuation
   ```

---

## Test Results

### With Current Fixed Code:
```typescript
Input: `Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111`

✅ accountNumber: "78800058952"
✅ accountType: "SAVINGS"
✅ phoneNumber: "3136379718"
✅ idDocumentNumber: "1235039039"
✅ address: "Calle 110 #45-47"
✅ city: "Bogota"
✅ postCode: "110111"
```

### Edge Cases Handled:
1. ✅ **Single field (no dash):** `"Phone: 3136379718"` → `"3136379718"`
2. ✅ **Multiple fields with dashes:** `"Phone: 3136379718 - City: Bogota"` → `"3136379718"`
3. ✅ **Field with internal hyphens:** `"Address: Calle 110 #45-47"` → `"Calle 110 #45-47"` (preserves internal dash)
4. ✅ **Field at end of line:** `"Post code: 110111"` → `"110111"`

---

## Why the User May Still See Errors

If the user is still experiencing the error described in their report, it's likely due to one of these reasons:

### 1. **Running Old Deployed Code**
   - The fix is in the codebase but not deployed to production
   - **Solution:** Rebuild and redeploy the application
   ```bash
   npm run build
   npm start  # or restart the deployed service
   ```

### 2. **Testing with Old Error Messages**
   - The user may be referencing an old error from before the fix
   - **Solution:** Test with a fresh transfer using the exact input above

### 3. **Cache Issues**
   - Old compiled `dist/` files may be cached
   - **Solution:** Clean build
   ```bash
   rm -rf dist/
   npm run build
   ```

### 4. **Environment Mismatch**
   - Testing locally vs deployed code running different versions
   - **Solution:** Verify git commit hash matches deployed version
   ```bash
   git rev-parse HEAD  # Check current commit
   ```

---

## Additional Improvements Recommended

While the current fix works well, here are potential enhancements:

### 1. **Simplify with Capture Group and Cleaner Regex**

Instead of complex lookahead, use a simpler approach:

```typescript
// Alternative: Simpler regex that stops at dash or newline
const fieldPattern = new RegExp(
  `${escapedIdentifier}\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`,
  'i'
);
```

**Explanation:**
- `[^-\\n]+?` - Match anything except dash or newline (non-greedy)
- `\\s*` - Trim trailing whitespace
- `(?:-|$)` - Stop at dash OR end of string

**Trade-off:** This would stop at ANY dash, including internal ones like "45-47"

### 2. **Smart First-Word Matching**

The current code tries full label, field name, then aliases. Consider adding first-word fallback:

```typescript
// Extract first word of label as fallback (e.g., "Phone" from "Phone Number")
const labelWords = field.label.split(' ');
const firstWord = labelWords[0];
if (firstWord !== field.label && firstWord.length > 2) {
  identifiers.push(firstWord);
}
```

**Benefit:** Handles user shortcuts like "Phone:" instead of "Phone Number:"

### 3. **Context-Aware Value Validation**

Add field-specific validation before accepting extracted values:

```typescript
// Example: Validate phone numbers are digits
if (field.name === 'phoneNumber' && !/^\d{7,20}$/.test(value)) {
  continue; // Skip invalid phone number, try next identifier
}

// Example: Validate account type
if (field.name === 'accountType' && !['SAVINGS', 'CURRENT', 'CHECKING'].includes(value.toUpperCase())) {
  continue;
}
```

---

## Conclusion

✅ **The parsing bug is FIXED** in the current codebase (`/src/server.ts` lines 528-570)

✅ **The fix correctly extracts** all fields from the user's problematic input

✅ **Deployment needed:** If errors persist, rebuild and redeploy:
```bash
npm run build  # Rebuild TypeScript to JavaScript
npm start      # Restart server (or redeploy to hosting platform)
```

📊 **Test verification:** Run the test suite to confirm:
```bash
npx tsx test-parser-bug.ts          # Test the fix
npx tsx test-wise-extraction.ts     # Verify Wise API values
```

---

## File References

- **Source code:** `/Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers/src/server.ts` (lines 516-574)
- **Field definitions:** `/Users/edisonespinosa/Desktop/MyBambu-Conversational-Transfers/repos/whatsapp-transfers/src/services/recipient-fields.ts` (lines 119-181)
- **Test scripts:**
  - `test-parser-bug.ts` - Compares old vs new regex
  - `test-current-regex.ts` - Tests current lookahead pattern
  - `test-wise-extraction.ts` - Simulates Wise API extraction

---

**Generated:** 2025-11-19
