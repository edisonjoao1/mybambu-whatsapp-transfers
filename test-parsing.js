/**
 * Test script to verify bank detail parsing logic
 * Tests against the exact user format provided
 */

// Simulated field definitions with aliases
const colombiaFields = [
  {
    name: 'accountNumber',
    label: 'Account Number',
    aliases: ['Bank account number', 'Account number', 'Account']
  },
  {
    name: 'accountType',
    label: 'Account Type',
    aliases: ['Account type', 'Type', 'Tipo de cuenta']
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    aliases: ['Phone', 'Phone number', 'Teléfono', 'Telefono']
  },
  {
    name: 'idDocumentNumber',
    label: 'Cédula Number',
    aliases: ['Cédula', 'Cedula', 'Cédula number', 'Cedula number', 'ID', 'CC']
  },
  {
    name: 'city',
    label: 'City',
    aliases: ['City', 'Ciudad']
  },
  {
    name: 'address',
    label: 'Street Address',
    aliases: ['Address', 'Street address', 'Dirección', 'Direccion']
  },
  {
    name: 'postCode',
    label: 'Post Code',
    aliases: ['Post code', 'Postcode', 'Postal code', 'Zip code', 'Zip', 'Código postal', 'Codigo postal']
  }
];

// Test input - exact format from user
const testInput = `Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111`;

// Expected output
const expectedOutput = {
  accountNumber: "78800058952",
  accountType: "SAVINGS",
  phoneNumber: "3136379718",
  idDocumentNumber: "1235039039",
  address: "Calle 110 #45-47",
  city: "Bogota",
  postCode: "110111"
};

// Parsing logic (matches server.ts implementation)
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
          console.log(`✅ Extracted ${field.name}: "${value}" (matched on "${identifier}")`);
          break;
        }
      }
    }
  }

  return details;
}

// Run test
console.log('🧪 Testing bank detail parsing...\n');
console.log('📝 Input:');
console.log(testInput);
console.log('\n' + '='.repeat(80) + '\n');

const result = parseFields(testInput, colombiaFields);

console.log('\n' + '='.repeat(80) + '\n');
console.log('📊 Results:\n');

let allCorrect = true;

for (const [key, expectedValue] of Object.entries(expectedOutput)) {
  const actualValue = result[key];
  const match = actualValue === expectedValue;

  if (!match) {
    allCorrect = false;
  }

  const status = match ? '✅' : '❌';
  console.log(`${status} ${key}:`);
  console.log(`   Expected: "${expectedValue}"`);
  console.log(`   Got:      "${actualValue || '(missing)'}"`);
  console.log();
}

console.log('='.repeat(80));
if (allCorrect) {
  console.log('✅ ALL TESTS PASSED!');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
