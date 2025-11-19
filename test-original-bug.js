#!/usr/bin/env node

/**
 * Test the ORIGINAL bug that was reported
 * Input: "Phone: 3136379718 - Cedula: 123..."
 * Expected: Phone = "3136379718", Cedula = "123..."
 * Bug was: Phone captured "3136379718 - Cedula"
 */

const testInput = "Phone: 3136379718 - Cedula: 123456789 - Account type: SAVINGS";

const fields = [
  { name: 'phoneNumber', label: 'Phone' },
  { name: 'idDocumentNumber', label: 'Cedula' },
  { name: 'accountType', label: 'Account type' }
];

console.log('🐛 Testing Original Bug Report\n');
console.log('=' .repeat(70));
console.log(`Input: "${testInput}"\n`);

const extractedDetails = {};

// Use the IMPROVED regex from server.ts
for (const field of fields) {
  const escapedIdentifier = field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fieldPattern = new RegExp(
    `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s*[-,]\\s*[A-Za-z]|\\n|$)`,
    'i'
  );

  const match = testInput.match(fieldPattern);
  if (match) {
    let value = match[1].trim();
    value = value.replace(/[\s\-,;]+$/, '');
    value = value.trim();

    if (value) {
      extractedDetails[field.name] = value;
      console.log(`✅ ${field.label}: "${value}"`);
    }
  }
}

console.log('\n' + '=' .repeat(70));

// Verify results
const expectedResults = {
  phoneNumber: '3136379718',
  idDocumentNumber: '123456789',
  accountType: 'SAVINGS'
};

let allCorrect = true;
for (const [key, expected] of Object.entries(expectedResults)) {
  const actual = extractedDetails[key];
  if (actual !== expected) {
    console.log(`❌ FAIL: ${key} - Expected "${expected}", got "${actual}"`);
    allCorrect = false;
  }
}

if (allCorrect) {
  console.log('\n🎉 SUCCESS! The bug is fixed!');
  console.log('   Phone correctly extracted without capturing " - Cedula"');
  console.log('   All fields parsed correctly with field separators.\n');
  process.exit(0);
} else {
  console.log('\n❌ FAILED: Bug still exists\n');
  process.exit(1);
}
