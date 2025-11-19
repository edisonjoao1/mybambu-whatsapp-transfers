/**
 * Test script to reproduce and verify the parsing bug fix
 */

// Simulating the field requirements for Colombia
const colombiaFields = [
  {
    name: 'accountNumber',
    label: 'Account Number',
    description: 'Bank account number (4-20 characters)',
    required: true,
    example: '00012345678'
  },
  {
    name: 'accountType',
    label: 'Account Type',
    description: 'CURRENT (checking) or SAVINGS',
    required: true,
    example: 'SAVINGS'
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    description: 'Colombian phone number (7-20 digits)',
    required: true,
    example: '3001234567'
  },
  {
    name: 'idDocumentNumber',
    label: 'Cédula Number',
    description: 'Colombian national ID number (Cédula de Ciudadanía)',
    required: true,
    example: '1234567890'
  },
  {
    name: 'city',
    label: 'City',
    description: 'City where recipient lives',
    required: true,
    example: 'Bogotá'
  },
  {
    name: 'address',
    label: 'Street Address',
    description: 'Recipient\'s street address',
    required: true,
    example: 'Calle 123 #45-67'
  },
  {
    name: 'postCode',
    label: 'Post Code',
    description: 'Postal code',
    required: true,
    example: '110111'
  }
];

// User's problematic input
const userInput = `Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111`;

console.log("=".repeat(80));
console.log("PARSING BUG TEST");
console.log("=".repeat(80));
console.log("\nUser Input:");
console.log(userInput);
console.log("\n" + "=".repeat(80));

// CURRENT REGEX (BUGGY)
console.log("\n1️⃣  CURRENT REGEX (BUGGY):");
console.log("Pattern: `(?:field.name|field.label)\\\\s*:?\\\\s*([\\\\w\\\\s\\\\-\\\\.\\\\+\\\\(\\\\)]+)`");
console.log("-".repeat(80));

const buggyDetails: Record<string, string> = {};

for (const field of colombiaFields) {
  const fieldPattern = new RegExp(`(?:${field.name}|${field.label})\\s*:?\\s*([\\w\\s\\-\\.\\+\\(\\)]+)`, 'i');
  const match = userInput.match(fieldPattern);
  if (match && !buggyDetails[field.name]) {
    buggyDetails[field.name] = match[1].trim();
    console.log(`✓ ${field.label}: "${match[1].trim()}"`);
  } else {
    console.log(`✗ ${field.label}: NOT FOUND`);
  }
}

console.log("\n❌ PROBLEMS:");
console.log(`   Account Number: "${buggyDetails.accountNumber}"`);
console.log(`   Account Type:   "${buggyDetails.accountType}"`);
console.log(`   ID Number:      "${buggyDetails.idDocumentNumber}"`);

// FIXED REGEX
console.log("\n\n" + "=".repeat(80));
console.log("2️⃣  FIXED REGEX (STOPS AT DASH/HYPHEN):");
console.log("Pattern: `(?:field.name|field.label)\\\\s*:?\\\\s*([^-\\\\n]+?)\\\\s*(?:-|$)`");
console.log("-".repeat(80));

const fixedDetails: Record<string, string> = {};

for (const field of colombiaFields) {
  // Fixed regex: Stop at dash or end of line, non-greedy match
  // Try full label first, then field name, then first word of label
  const labelWords = field.label.split(' ');
  const firstWord = labelWords[0];

  // Try patterns in order of specificity: full label > field name > first word
  let match = null;

  // Try full label first (most specific)
  let fieldPattern = new RegExp(`(?:${field.label})\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`, 'i');
  match = userInput.match(fieldPattern);

  // Try field name if no match
  if (!match) {
    fieldPattern = new RegExp(`(?:${field.name})\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`, 'i');
    match = userInput.match(fieldPattern);
  }

  // Try first word as last resort (least specific)
  if (!match && firstWord !== field.label) {
    fieldPattern = new RegExp(`\\b${firstWord}\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`, 'i');
    match = userInput.match(fieldPattern);
  }

  if (match && !fixedDetails[field.name]) {
    const cleanValue = match[1].trim();
    fixedDetails[field.name] = cleanValue;
    console.log(`✓ ${field.label}: "${cleanValue}"`);
  } else {
    console.log(`✗ ${field.label}: NOT FOUND`);
  }
}

console.log("\n✅ FIXED OUTPUT:");
console.log(`   Account Number: "${fixedDetails.accountNumber}"`);
console.log(`   Account Type:   "${fixedDetails.accountType}"`);
console.log(`   ID Number:      "${fixedDetails.idDocumentNumber}"`);
console.log(`   Phone Number:   "${fixedDetails.phoneNumber}"`);
console.log(`   Address:        "${fixedDetails.address}"`);
console.log(`   City:           "${fixedDetails.city}"`);
console.log(`   Post Code:      "${fixedDetails.postCode}"`);

// Validation
console.log("\n\n" + "=".repeat(80));
console.log("3️⃣  VALIDATION:");
console.log("-".repeat(80));

const expectedValues = {
  accountNumber: '78800058952',
  accountType: 'SAVINGS',
  phoneNumber: '3136379718',
  idDocumentNumber: '1235039039',
  address: 'Calle 110 #45',
  city: 'Bogota',
  postCode: '110111'
};

let allCorrect = true;
for (const [key, expected] of Object.entries(expectedValues)) {
  const actual = fixedDetails[key];
  const isCorrect = actual === expected;
  if (!isCorrect) {
    console.log(`❌ ${key}: Expected "${expected}", got "${actual}"`);
    allCorrect = false;
  } else {
    console.log(`✅ ${key}: "${actual}"`);
  }
}

console.log("\n" + "=".repeat(80));
if (allCorrect) {
  console.log("🎉 ALL TESTS PASSED!");
} else {
  console.log("⚠️  SOME TESTS FAILED");
}
console.log("=".repeat(80));

// Test edge cases
console.log("\n\n" + "=".repeat(80));
console.log("4️⃣  EDGE CASE TESTS:");
console.log("-".repeat(80));

const edgeCases = [
  {
    name: "Single field (no dash)",
    input: "Phone: 3136379718",
    field: { name: 'phoneNumber', label: 'Phone Number' },
    expected: '3136379718'
  },
  {
    name: "Multiple fields with dashes",
    input: "Phone: 3136379718 - City: Bogota",
    field: { name: 'phoneNumber', label: 'Phone Number' },
    expected: '3136379718'
  },
  {
    name: "Field with special chars in value",
    input: "Address: Calle 110 #45-47",
    field: { name: 'address', label: 'Street Address' },
    expected: 'Calle 110 #45'
  },
  {
    name: "Field at end of line",
    input: "Post code: 110111",
    field: { name: 'postCode', label: 'Post Code' },
    expected: '110111'
  }
];

for (const testCase of edgeCases) {
  const labelWords = testCase.field.label.split(' ');
  const firstWord = labelWords[0];
  const fieldPattern = new RegExp(`(?:${testCase.field.name}|${testCase.field.label}|${firstWord})\\s*:?\\s*([^-\\n]+?)\\s*(?:-|$)`, 'i');
  const match = testCase.input.match(fieldPattern);
  const actual = match ? match[1].trim() : null;
  const passed = actual === testCase.expected;

  console.log(`\n${passed ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Input:    "${testCase.input}"`);
  console.log(`   Expected: "${testCase.expected}"`);
  console.log(`   Got:      "${actual}"`);
}

console.log("\n" + "=".repeat(80));
