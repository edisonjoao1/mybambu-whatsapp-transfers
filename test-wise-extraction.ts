/**
 * Test what values are being sent to Wise API
 * Simulate the exact flow from parsing to Wise API call
 */

const userInput = `Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111`;

// Colombia field definitions with potential aliases
const colombiaFields = [
  {
    name: 'accountNumber',
    label: 'Account Number',
    aliases: ['Bank account number', 'Account number', 'Account']
  },
  {
    name: 'accountType',
    label: 'Account Type',
    aliases: ['Type', 'Account type']
  },
  {
    name: 'phoneNumber',
    label: 'Phone Number',
    aliases: ['Phone', 'Phone number', 'Tel']
  },
  {
    name: 'idDocumentNumber',
    label: 'Cédula Number',
    aliases: ['Cédula', 'Cedula', 'ID', 'Cédula number', 'Cedula number']
  },
  {
    name: 'city',
    label: 'City',
    aliases: []
  },
  {
    name: 'address',
    label: 'Street Address',
    aliases: ['Address', 'Street', 'Street address']
  },
  {
    name: 'postCode',
    label: 'Post Code',
    aliases: ['Postal code', 'Post code', 'Zip', 'ZIP']
  }
];

console.log("=".repeat(80));
console.log("WISE API EXTRACTION TEST");
console.log("=".repeat(80));
console.log("\nUser Input:");
console.log(userInput);
console.log("\n" + "=".repeat(80));

const details: Record<string, string> = {};

// Simulate current parsing logic
for (const field of colombiaFields) {
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

    // Current regex pattern
    const fieldPattern = new RegExp(
      `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)`,
      'i'
    );

    const match = userInput.match(fieldPattern);
    if (match) {
      // Clean the captured value
      let value = match[1].trim();
      value = value.replace(/[\s\-]+$/, ''); // Remove trailing spaces and dashes
      value = value.replace(/[,;]+$/, ''); // Remove trailing punctuation

      if (value) {
        details[field.name] = value;
        console.log(`✅ ${field.name}: "${value}" (via "${identifier}")`);
        break; // Found a match, move to next field
      }
    }
  }
}

console.log("\n" + "=".repeat(80));
console.log("VALUES SENT TO WISE API:");
console.log("=".repeat(80));
console.log(JSON.stringify({
  accountNumber: details.accountNumber,
  accountType: details.accountType,
  phoneNumber: details.phoneNumber,
  idDocumentNumber: details.idDocumentNumber,
  address: details.address,
  city: details.city,
  postCode: details.postCode
}, null, 2));

console.log("\n" + "=".repeat(80));
console.log("WISE API ERROR SIMULATION:");
console.log("=".repeat(80));

// Check what Wise would receive
if (details.accountNumber !== '78800058952') {
  console.log(`❌ accountNumber: Expected "78800058952", got "${details.accountNumber}"`);
}
if (details.accountType !== 'SAVINGS') {
  console.log(`❌ accountType: Expected "SAVINGS", got "${details.accountType}"`);
}
if (details.idDocumentNumber !== '1235039039') {
  console.log(`❌ idDocumentNumber: Expected "1235039039", got "${details.idDocumentNumber}"`);
}

// Show what Wise error says
console.log("\n📋 ACTUAL WISE ERROR:");
console.log('  accountNumber: "78800058952-Accounttype"');
console.log('  accountType: "SAVINGS   -  \\nPHONE"');
console.log('  idDocumentNumber: "1235039039   - Address"');

console.log("\n" + "=".repeat(80));
