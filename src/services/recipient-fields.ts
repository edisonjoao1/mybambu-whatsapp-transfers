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

  // Costa Rica
  'CRC': {
    country: 'Costa Rica',
    currency: 'CRC',
    accountType: 'costa_rica',
    fields: [
      {
        name: 'IBAN',
        label: 'IBAN',
        description: 'Costa Rican IBAN (22 characters)',
        required: true,
        example: 'CR95015114920010169410',
        aliases: ['IBAN', 'International Bank Account Number', 'Número de cuenta IBAN']
      },
      {
        name: 'idDocumentType',
        label: 'ID Document Type',
        description: 'National ID, Foreigner ID, or Business ID',
        required: true,
        example: 'NATIONAL_ID_CARD',
        aliases: ['ID type', 'Document type', 'Tipo de documento']
      },
      {
        name: 'idDocumentNumber',
        label: 'ID Number',
        description: 'Identification number (Cédula)',
        required: true,
        example: '901270245',
        aliases: ['ID number', 'Cédula', 'Cedula', 'Document number', 'Número de identificación']
      },
      {
        name: 'city',
        label: 'City',
        description: 'City where recipient lives',
        required: true,
        example: 'San José',
        aliases: ['City', 'Ciudad']
      },
      {
        name: 'address',
        label: 'Street Address',
        description: 'Recipient\'s street address',
        required: true,
        example: 'Avenida Central 123',
        aliases: ['Address', 'Street address', 'Dirección', 'Direccion']
      },
      {
        name: 'postCode',
        label: 'Post Code',
        description: 'Postal code',
        required: true,
        example: '10101',
        aliases: ['Post code', 'Postcode', 'Postal code', 'Zip code', 'Zip', 'Código postal', 'Codigo postal']
      }
    ],
    instructions: 'For Costa Rica, we need the recipient\'s IBAN (22 characters), ID document type (National ID, Foreigner ID, or Business ID), ID number (Cédula), and complete address (city, street address, and postal code).'
  },

  // Uruguay
  'UYU': {
    country: 'Uruguay',
    currency: 'UYU',
    accountType: 'uruguay',
    fields: [
      {
        name: 'accountType',
        label: 'Account Type',
        description: 'CHECKING or SAVINGS',
        required: true,
        example: 'CHECKING',
        aliases: ['Account type', 'Type', 'Tipo de cuenta', 'Checking', 'Savings', 'Corriente', 'Ahorro']
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        description: 'Bank account number (up to 20 digits)',
        required: true,
        example: '265487900',
        aliases: ['Account number', 'Account', 'Número de cuenta', 'Numero de cuenta', 'Cuenta']
      },
      {
        name: 'idDocumentType',
        label: 'ID Document Type',
        description: 'National ID or Tax ID (RUT/RUC)',
        required: true,
        example: 'NATIONAL_ID',
        aliases: ['ID type', 'Document type', 'Tipo de documento']
      },
      {
        name: 'idDocumentNumber',
        label: 'ID Number',
        description: 'Cédula de Identidad or RUT/RUC',
        required: true,
        example: '12345678',
        aliases: ['ID number', 'Cédula', 'Cedula', 'RUT', 'RUC', 'Document number', 'Número de identificación']
      },
      {
        name: 'bankCode',
        label: 'Bank Code',
        description: 'Bank identifier code',
        required: true,
        example: '001',
        aliases: ['Bank code', 'Bank', 'Código del banco', 'Codigo del banco', 'Banco']
      },
      {
        name: 'city',
        label: 'City',
        description: 'City where recipient lives',
        required: true,
        example: 'Montevideo',
        aliases: ['City', 'Ciudad']
      },
      {
        name: 'address',
        label: 'Street Address',
        description: 'Recipient\'s street address',
        required: true,
        example: 'Avenida 18 de Julio 1234',
        aliases: ['Address', 'Street address', 'Dirección', 'Direccion']
      },
      {
        name: 'postCode',
        label: 'Post Code',
        description: 'Postal code',
        required: true,
        example: '11200',
        aliases: ['Post code', 'Postcode', 'Postal code', 'Zip code', 'Zip', 'Código postal', 'Codigo postal']
      }
    ],
    instructions: 'For Uruguay, we need the recipient\'s account type (checking or savings), account number, ID type (National ID or Tax ID), ID number (Cédula or RUT/RUC), bank code, and complete address (city, street address, and postal code).'
  },

  // Chile
  'CLP': {
    country: 'Chile',
    currency: 'CLP',
    accountType: 'chile',
    fields: [
      {
        name: 'bankCode',
        label: 'Bank Code',
        description: 'Chilean bank identifier',
        required: true,
        example: '001',
        aliases: ['Bank code', 'Bank', 'Código del banco', 'Codigo del banco', 'Banco']
      },
      {
        name: 'accountNumber',
        label: 'Account Number',
        description: 'Bank account number (4-20 digits)',
        required: true,
        example: '12345678901234567890',
        aliases: ['Account number', 'Account', 'Número de cuenta', 'Numero de cuenta', 'Cuenta']
      },
      {
        name: 'rut',
        label: 'RUT',
        description: 'Chilean tax ID (Rol Único Tributario)',
        required: true,
        example: '760864285',
        aliases: ['RUT', 'Rol Único Tributario', 'Tax ID', 'Número de identificación']
      },
      {
        name: 'accountType',
        label: 'Account Type',
        description: 'CHECKING, SAVINGS, or CUENTA_VISTA',
        required: true,
        example: 'CHECKING',
        aliases: ['Account type', 'Type', 'Tipo de cuenta', 'Checking', 'Savings', 'Cuenta corriente', 'Cuenta de ahorro', 'Cuenta vista']
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        description: 'Chilean phone number (7-20 digits)',
        required: true,
        example: '+56 33 555 5555',
        aliases: ['Phone', 'Phone number', 'Teléfono', 'Telefono']
      },
      {
        name: 'city',
        label: 'City',
        description: 'City where recipient lives',
        required: true,
        example: 'Santiago',
        aliases: ['City', 'Ciudad']
      },
      {
        name: 'address',
        label: 'Street Address',
        description: 'Recipient\'s street address',
        required: true,
        example: 'Avenida Libertador 1234',
        aliases: ['Address', 'Street address', 'Dirección', 'Direccion']
      },
      {
        name: 'postCode',
        label: 'Post Code',
        description: 'Postal code',
        required: true,
        example: '8320000',
        aliases: ['Post code', 'Postcode', 'Postal code', 'Zip code', 'Zip', 'Código postal', 'Codigo postal']
      }
    ],
    instructions: 'For Chile, we need the recipient\'s bank code, account number, RUT (tax ID), account type (checking, savings, or demand account), phone number, and complete address (city, street address, and postal code).'
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
