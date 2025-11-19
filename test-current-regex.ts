/**
 * Test the CURRENT regex implementation to see why it's failing
 */

const userInput = `Bank account number: 78800058952   -
Account type: SAVINGS   -
Phone: 3136379718   -
Cédula number: 1235039039   - Address: Calle 110 #45-47   - City: Bogota   -
Post code: 110111`;

const testFields = [
  { name: 'accountNumber', label: 'Account Number' },
  { name: 'accountType', label: 'Account Type' },
  { name: 'phoneNumber', label: 'Phone Number' },
  { name: 'idDocumentNumber', label: 'Cédula Number' },
];

console.log("=".repeat(80));
console.log("TESTING CURRENT REGEX PATTERN");
console.log("=".repeat(80));
console.log("\nUser Input:");
console.log(userInput);
console.log("\n" + "=".repeat(80));

console.log("\nCURRENT PATTERN: `identifier\\\\s*:?\\\\s*([^:\\\\n]+?)(?=\\\\s+-\\\\s+[A-Z]|\\\\n[A-Z]|$)`");
console.log("-".repeat(80));

for (const field of testFields) {
  const identifiers = [field.name, field.label];

  for (const identifier of identifiers) {
    const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fieldPattern = new RegExp(
      `${escapedIdentifier}\\s*:?\\s*([^:\\n]+?)(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)`,
      'i'
    );

    const match = userInput.match(fieldPattern);
    if (match) {
      let value = match[1].trim();
      value = value.replace(/[\s\-]+$/, '');
      value = value.replace(/[,;]+$/, '');
      console.log(`\n✓ ${field.label} (via "${identifier}"):`);
      console.log(`  Raw match: "${match[1]}"`);
      console.log(`  Cleaned:   "${value}"`);
      break;
    }
  }
}

console.log("\n\n" + "=".repeat(80));
console.log("PROBLEM ANALYSIS:");
console.log("=".repeat(80));
console.log("\nThe lookahead `(?=\\s+-\\s+[A-Z]|\\n[A-Z]|$)` requires:");
console.log("  1. \\s+ - One or more whitespace BEFORE the dash");
console.log("  2. -   - The dash itself");
console.log("  3. \\s+ - One or more whitespace AFTER the dash");
console.log("  4. [A-Z] - Capital letter (start of next field)");
console.log("\nBUT the input has:");
console.log('  "78800058952   -\\n" (dash at end of line, NO capital after it)');
console.log('  "SAVINGS   -  \\nPHONE" (lowercase "Phone" on next line)');
console.log("\nThe pattern expects ' - Address' but the input has:");
console.log('  "1235039039   - Address" (works!)');
console.log('  "78800058952   -\\nAccount type" (dash at end, newline, then capital)');
console.log("\n❌ The lookahead doesn't match when:");
console.log("   - Dash is at end of line with newline after");
console.log("   - Next field starts with lowercase");
console.log("\n" + "=".repeat(80));
