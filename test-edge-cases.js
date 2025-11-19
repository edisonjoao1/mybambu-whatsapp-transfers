/**
 * Edge case tests for bank detail parsing
 */

const colombiaFields = [
  {
    name: 'accountNumber',
    label: 'Account Number',
    aliases: ['Bank account number', 'Account number', 'Account']
  },
  {
    name: 'accountType',
    label: 'Account Type',
    aliases: ['Account type', 'Type']
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    aliases: ['Phone', 'Phone number']
  },
  {
    name: 'address',
    label: 'Street Address',
    aliases: ['Address', 'Street address']
  }
];

function parseFields(text, fields) {
  const details = {};

  for (const field of fields) {
    if (details[field.name]) continue;

    const identifiers = [field.name, field.label];
    if (field.aliases) {
      identifiers.push(...field.aliases);
    }

    for (const identifier of identifiers) {
      const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const fieldPattern = new RegExp(
        `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)`,
        'i'
      );

      const match = text.match(fieldPattern);
      if (match) {
        let value = match[1].trim();
        value = value.replace(/[\s\-]+$/, '');
        value = value.replace(/[,;]+$/, '');

        if (value) {
          details[field.name] = value;
          break;
        }
      }
    }
  }

  return details;
}

// Test cases
const testCases = [
  {
    name: 'Original problematic format',
    input: 'Bank account number: 78800058952   - \nAccount type: SAVINGS   -  \nPhone: 3136379718',
    expected: {
      accountNumber: '78800058952',
      accountType: 'SAVINGS',
      phoneNumber: '3136379718'
    }
  },
  {
    name: 'Address with internal hyphens',
    input: 'Address: Calle 110 #45-47   - Phone: 1234567',
    expected: {
      address: 'Calle 110 #45-47',
      phoneNumber: '1234567'
    }
  },
  {
    name: 'Extra whitespace everywhere',
    input: 'Account number:    78800058952    -    Account type:    SAVINGS',
    expected: {
      accountNumber: '78800058952',
      accountType: 'SAVINGS'
    }
  },
  {
    name: 'No separators (clean format)',
    input: 'Account number: 78800058952\nAccount type: SAVINGS\nPhone: 1234567',
    expected: {
      accountNumber: '78800058952',
      accountType: 'SAVINGS',
      phoneNumber: '1234567'
    }
  },
  {
    name: 'Field aliases work',
    input: 'Phone: 3136379718 - Account: 78800058952',
    expected: {
      phoneNumber: '3136379718',
      accountNumber: '78800058952'
    }
  },
  {
    name: 'Single line with multiple fields',
    input: 'Account type: SAVINGS - Phone: 3136379718 - Address: Calle 123',
    expected: {
      accountType: 'SAVINGS',
      phoneNumber: '3136379718',
      address: 'Calle 123'
    }
  }
];

console.log('🧪 Running edge case tests...\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  console.log(`\n📋 Test: ${test.name}`);
  console.log(`📝 Input: "${test.input}"\n`);

  const result = parseFields(test.input, colombiaFields);

  let testPassed = true;
  for (const [key, expectedValue] of Object.entries(test.expected)) {
    const actualValue = result[key];
    const match = actualValue === expectedValue;

    if (!match) {
      testPassed = false;
      console.log(`❌ ${key}: expected "${expectedValue}", got "${actualValue || '(missing)'}"`);
    } else {
      console.log(`✅ ${key}: "${actualValue}"`);
    }
  }

  if (testPassed) {
    console.log('✅ PASSED');
    passed++;
  } else {
    console.log('❌ FAILED');
    failed++;
  }

  console.log('='.repeat(80));
}

console.log(`\n📊 Summary: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed > 0) {
  process.exit(1);
}
