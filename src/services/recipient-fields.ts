/**
 * Defines required bank account fields for each country/currency
 * Based on Wise API requirements
 */

export interface BankFieldRequirement {
  name: string;
  label: string;
  description: string;
  required: boolean;
  example: string;
  aliases?: string[]; // Alternative field names that map to this field
}

export interface CountryBankRequirements {
  country: string;
  currency: string;
  accountType: string;
  fields: BankFieldRequirement[];
  instructions: string;
}

export const COUNTRY_BANK_REQUIREMENTS: Record<string, CountryBankRequirements> = {
  // Mexico
  'MXN': {
    country: 'Mexico',
    currency: 'MXN',
    accountType: 'mexican',
    fields: [
      {
        name: 'clabe',
        label: 'CLABE Number',
        description: 'Mexican standardized 18-digit bank account number',
        required: true,
        example: '032180000118359719'
      }
    ],
    instructions: 'For Mexico, we need the recipient\'s CLABE number (18 digits). This is the standardized Mexican bank account number. The recipient can find it on their bank statement or by calling their bank.'
  },

  // Brazil
  'BRL': {
    country: 'Brazil',
    currency: 'BRL',
    accountType: 'brazilian',
    fields: [
      {
        name: 'cpf',
        label: 'CPF',
        description: 'Brazilian tax ID (11 digits)',
        required: true,
        example: '12345678901',
        aliases: ['CPF', 'Tax ID', 'Cadastro de Pessoas Físicas', 'Documento']
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        description: 'Bank account number',
        required: true,
        example: '12345678',
        aliases: ['Account number', 'Account', 'Número da conta', 'Numero da conta', 'Conta']
      },
      {
        name: 'accountType',
        label: 'Account Type',
        description: 'checking or savings',
        required: true,
        example: 'checking',
        aliases: ['Account type', 'Type', 'Tipo de conta', 'Tipo', 'Checking', 'Savings', 'Corrente', 'Poupança', 'Poupanca']
      },
      {
        name: 'bankCode',
        label: 'Bank Code',
        description: '3-digit bank code',
        required: true,
        example: '001',
        aliases: ['Bank code', 'Code', 'Código do banco', 'Codigo do banco', 'Banco']
      }
    ],
    instructions: 'For Brazil, we need the recipient\'s CPF (tax ID), bank account number, account type (checking or savings), and the 3-digit bank code.'
  },

  // United Kingdom
  'GBP': {
    country: 'United Kingdom',
    currency: 'GBP',
    accountType: 'sort_code',
    fields: [
      {
        name: 'sortCode',
        label: 'Sort Code',
        description: '6-digit UK bank sort code',
        required: true,
        example: '231470'
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        description: '8-digit UK account number',
        required: true,
        example: '31926819'
      }
    ],
    instructions: 'For UK transfers, we need the recipient\'s 6-digit sort code and 8-digit account number. These can be found on their bank statement or card.'
  },

  // Europe (IBAN)
  'EUR': {
    country: 'Europe',
    currency: 'EUR',
    accountType: 'iban',
    fields: [
      {
        name: 'iban',
        label: 'IBAN',
        description: 'International Bank Account Number',
        required: true,
        example: 'DE89370400440532013000'
      }
    ],
    instructions: 'For European transfers, we need the recipient\'s IBAN (International Bank Account Number). This can be found on their bank statement.'
  },

  // Argentina
  'ARS': {
    country: 'Argentina',
    currency: 'ARS',
    accountType: 'argentina',
    fields: [
      {
        name: 'accountNumber',
        label: 'CBU/CVU Number',
        description: 'Argentine bank account number (22 digits)',
        required: true,
        example: '0170099520000006542386',
        aliases: ['CBU', 'CVU', 'Account number', 'Número de cuenta', 'Numero de cuenta', 'Cuenta']
      },
      {
        name: 'accountType',
        label: 'Account Type',
        description: 'CHECKING (cuenta corriente) or SAVINGS (caja de ahorro)',
        required: true,
        example: 'SAVINGS',
        aliases: ['Account type', 'Type', 'Tipo de cuenta', 'Tipo', 'Checking', 'Savings', 'Cuenta corriente', 'Caja de ahorro']
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        description: 'Argentine phone number (10-20 digits)',
        required: true,
        example: '1145678901',
        aliases: ['Phone', 'Phone number', 'Teléfono', 'Telefono']
      },
      {
        name: 'idDocumentNumber',
        label: 'DNI/CUIT/CUIL',
        description: 'Argentine national ID (DNI), CUIT, or CUIL',
        required: true,
        example: '12345678',
        aliases: ['DNI', 'CUIT', 'CUIL', 'ID', 'Documento', 'Identification']
      },
      {
        name: 'city',
        label: 'City',
        description: 'City where recipient lives',
        required: true,
        example: 'Buenos Aires',
        aliases: ['City', 'Ciudad']
      }
    ],
    instructions: 'For Argentina, we need the recipient\'s CBU or CVU (22-digit bank account number), account type (CHECKING or SAVINGS), phone number, DNI/CUIT/CUIL, and city.'
  },

  // Chile
  'CLP': {
    country: 'Chile',
    currency: 'CLP',
    accountType: 'chile',
    fields: [
      {
        name: 'accountNumber',
        label: 'Account Number',
        description: 'Chilean bank account number',
        required: true,
        example: '1234567890',
        aliases: ['Account number', 'Account', 'Número de cuenta', 'Numero de cuenta', 'Cuenta']
      },
      {
        name: 'accountType',
        label: 'Account Type',
        description: 'CHECKING (cuenta corriente) or SAVINGS (cuenta de ahorro)',
        required: true,
        example: 'CHECKING',
        aliases: ['Account type', 'Type', 'Tipo de cuenta', 'Tipo', 'Checking', 'Savings', 'Cuenta corriente', 'Cuenta de ahorro']
      },
      {
        name: 'bankCode',
        label: 'Bank Code',
        description: 'Chilean bank code (e.g., BCHICLRM for Banco de Chile)',
        required: true,
        example: 'BCHICLRM',
        aliases: ['Bank code', 'Code', 'Código del banco', 'Codigo del banco', 'Banco', 'SWIFT', 'BIC']
      },
      {
        name: 'idDocumentNumber',
        label: 'RUT',
        description: 'Chilean RUT (Rol Único Tributario)',
        required: true,
        example: '12345678-9',
        aliases: ['RUT', 'Rol Unico Tributario', 'ID', 'Documento']
      }
    ],
    instructions: 'For Chile, we need the recipient\'s bank account number, account type (CHECKING or SAVINGS), bank code (SWIFT/BIC), and RUT (Chilean ID).'
  },

  // Colombia
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
    instructions: 'For Colombia, we need the recipient\'s bank account number, account type (CURRENT for checking or SAVINGS), phone number, Cédula number (Colombian national ID), and complete address (city, street address, and postal code). Note: In Wise sandbox, only Bancolombia bank is supported for testing.'
  },
};

/**
 * Get bank requirements for a specific currency
 */
export function getBankRequirements(currency: string): CountryBankRequirements | null {
  return COUNTRY_BANK_REQUIREMENTS[currency] || null;
}

/**
 * Validate bank details for a currency
 */
export function validateBankDetails(currency: string, details: Record<string, any>): { valid: boolean; missingFields: string[] } {
  const requirements = getBankRequirements(currency);

  if (!requirements) {
    return { valid: false, missingFields: ['Unknown currency'] };
  }

  const missingFields: string[] = [];

  for (const field of requirements.fields) {
    if (field.required && !details[field.name]) {
      missingFields.push(field.label);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Format bank details for display
 */
export function formatBankDetails(currency: string, details: Record<string, any>): string {
  const requirements = getBankRequirements(currency);

  if (!requirements) {
    return 'Unknown currency';
  }

  const lines: string[] = [];
  for (const field of requirements.fields) {
    if (details[field.name]) {
      lines.push(`${field.label}: ${details[field.name]}`);
    }
  }

  return lines.join('\n');
}
