#!/usr/bin/env node

/**
 * Test script for the improved bank details parsing regex
 * Tests the fix for the issue where "Phone: 3136379718 - Cedula: 123"
 * was capturing "3136379718 - Cedula" instead of just "3136379718"
 */

// Test fields similar to what's in recipient-fields.ts
const testFields = [
  { name: 'phoneNumber', label: 'Phone' },
  { name: 'idDocumentNumber', label: 'Cedula' },
  { name: 'accountType', label: 'Account type' },
  { name: 'address', label: 'Address' },
  { name: 'accountNumber', label: 'Account' },
];

// Test cases
const testCases = [
  {
    input: 'Phone: 3136379718',
    field: testFields[0],
    expected: '3136379718',
    description: 'Simple phone number'
  },
  {
    input: 'Phone: 3136379718 - Cedula: 123',
    field: testFields[0],
    expected: '3136379718',
    description: 'Phone with dash separator (THE BUG)'
  },
  {
    input: 'Cedula: 123456789',
    field: testFields[1],
    expected: '123456789',
    description: 'Simple cedula'
  },
  {
    input: 'Account type: SAVINGS   -',
    field: testFields[2],
    expected: 'SAVINGS',
    description: 'Account type with trailing dash'
  },
  {
    input: 'Address: Calle 110 #45-47',
    field: testFields[3],
    expected: 'Calle 110 #45-47',
    description: 'Address with internal hyphen (should keep it)'
  },
  {
    input: 'Address: Calle 110 #45-47 - Phone: 123',
    field: testFields[3],
    expected: 'Calle 110 #45-47',
    description: 'Address with internal hyphen AND field separator'
  },
  {
    input: 'Account: 1234567890123456',
    field: testFields[4],
    expected: '1234567890123456',
    description: 'Account number'
  },
  {
    input: 'Phone:3136379718-Cedula:123',
    field: testFields[0],
    expected: '3136379718',
    description: 'No spaces around colons and dash'
  },
  {
    input: 'Account type: CHECKING, Phone: 123',
    field: testFields[2],
    expected: 'CHECKING',
    description: 'With comma separator'
  }
];

console.log('🧪 Testing Bank Details Regex Fix\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const { input, field, expected, description } = testCase;

  // This is the IMPROVED regex from server.ts (latest version)
  const escapedIdentifier = field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fieldPattern = new RegExp(
    `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s*[-,]\\s*[A-Za-z]|\\n|$)`,
    'i'
  );

  const match = input.match(fieldPattern);
  let value = null;

  if (match) {
    value = match[1].trim();
    value = value.replace(/[\s\-,;]+$/, ''); // Remove trailing spaces, dashes, and punctuation
    value = value.trim(); // Final trim after cleanup
  }

  const success = value === expected;

  if (success) {
    passed++;
    console.log(`✅ PASS: ${description}`);
  } else {
    failed++;
    console.log(`❌ FAIL: ${description}`);
  }

  console.log(`   Input:    "${input}"`);
  console.log(`   Field:    ${field.label} (${field.name})`);
  console.log(`   Expected: "${expected}"`);
  console.log(`   Got:      "${value}"`);
  console.log('');
}

console.log('=' .repeat(70));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed (${passed + failed} total)`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! The regex fix is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Review the regex pattern.\n');
  process.exit(1);
}
