// Offline reference data, checked 2026-10-11 against the sources below.
// Display names omit legal suffixes. IDs are stable; never migrate stored bankName strings.
export const BANK_DIRECTORY_SOURCES = {
  verifiedOn: '2026-10-11',
  commercial:
    'https://www.rbi.org.in/commonman/English/Scripts/BanksInIndia.aspx',
  regionalRural:
    'https://financialservices.gov.in/list-rrbs-functioning-country',
};

export type BankCategory =
  | 'Public sector'
  | 'Private sector'
  | 'Small finance'
  | 'Regional rural'
  | 'Foreign';
export interface BankEntry {
  id: string;
  name: string;
  abbreviation: string;
  category: BankCategory;
  aliases: string[];
}
type BankRow = [
  id: string,
  name: string,
  abbreviation: string,
  ...aliases: string[],
];
const group = (category: BankCategory, rows: BankRow[]): BankEntry[] =>
  rows.map(([id, name, abbreviation, ...aliases]) => ({
    id,
    name,
    abbreviation,
    category,
    aliases,
  }));

export const BANK_DIRECTORY: BankEntry[] = [
  ...group('Public sector', [
    ['sbi', 'State Bank of India', 'SBI'],
    ['bob', 'Bank of Baroda', 'BOB'],
    ['boi', 'Bank of India', 'BOI'],
    ['bom', 'Bank of Maharashtra', 'BOM'],
    ['canara', 'Canara Bank', 'CAN'],
    ['central', 'Central Bank of India', 'CBI'],
    ['indian', 'Indian Bank', 'IB'],
    ['iob', 'Indian Overseas Bank', 'IOB'],
    ['psb', 'Punjab & Sind Bank', 'PSB', 'Punjab and Sind Bank'],
    ['pnb', 'Punjab National Bank', 'PNB'],
    ['uco', 'UCO Bank', 'UCO'],
    ['union', 'Union Bank of India', 'UBI'],
  ]),
  ...group('Private sector', [
    ['axis', 'Axis Bank', 'AXIS'],
    ['bandhan', 'Bandhan Bank', 'BAND'],
    ['csb', 'CSB Bank', 'CSB', 'Catholic Syrian Bank'],
    ['cub', 'City Union Bank', 'CUB'],
    ['dcb', 'DCB Bank', 'DCB', 'Development Credit Bank'],
    ['dhanlaxmi', 'Dhanlaxmi Bank', 'DHAN'],
    ['federal', 'Federal Bank', 'FED'],
    ['hdfc', 'HDFC Bank', 'HDFC'],
    ['icici', 'ICICI Bank', 'ICICI'],
    ['indusind', 'IndusInd Bank', 'IIB'],
    ['idfc-first', 'IDFC First Bank', 'IDFC'],
    [
      'jkb',
      'Jammu & Kashmir Bank',
      'JKB',
      'Jammu and Kashmir Bank',
      'J&K Bank',
    ],
    ['karnataka', 'Karnataka Bank', 'KBL'],
    ['kvb', 'Karur Vysya Bank', 'KVB'],
    ['kotak', 'Kotak Mahindra Bank', 'KMB'],
    ['nainital', 'Nainital Bank', 'NBL'],
    ['rbl', 'RBL Bank', 'RBL', 'Ratnakar Bank'],
    ['sib', 'South Indian Bank', 'SIB'],
    ['tmb', 'Tamilnad Mercantile Bank', 'TMB', 'Tamil Nadu Mercantile Bank'],
    ['yes', 'Yes Bank', 'YES'],
    ['idbi', 'IDBI Bank', 'IDBI'],
  ]),
  ...group('Small finance', [
    ['au', 'AU Small Finance Bank', 'AU'],
    ['capital', 'Capital Small Finance Bank', 'CAP'],
    ['equitas', 'Equitas Small Finance Bank', 'EQUI'],
    ['esaf', 'ESAF Small Finance Bank', 'ESAF'],
    ['suryoday', 'Suryoday Small Finance Bank', 'SUR'],
    ['ujjivan', 'Ujjivan Small Finance Bank', 'UJJ'],
    ['utkarsh', 'Utkarsh Small Finance Bank', 'UTK'],
    [
      'slice',
      'slice Small Finance Bank',
      'SLICE',
      'North East Small Finance Bank',
      'NESFB',
    ],
    ['jana', 'Jana Small Finance Bank', 'JANA'],
    ['shivalik', 'Shivalik Small Finance Bank', 'SHIV'],
    ['unity', 'Unity Small Finance Bank', 'UNITY'],
  ]),
  ...group('Regional rural', [
    ['rrb-ap', 'Andhra Pradesh Grameena Bank', 'APGB'],
    ['rrb-ar', 'Arunachal Pradesh Rural Bank', 'APRB'],
    ['rrb-as', 'Assam Gramin Bank', 'AGB'],
    ['rrb-br', 'Bihar Gramin Bank', 'BGB'],
    ['rrb-cg', 'Chhattisgarh Gramin Bank', 'CGB'],
    ['rrb-gj', 'Gujarat Gramin Bank', 'GGB'],
    ['rrb-hr', 'Haryana Gramin Bank', 'HGB'],
    ['rrb-hp', 'Himachal Pradesh Gramin Bank', 'HPGB'],
    ['rrb-jk', 'Jammu and Kashmir Grameen Bank', 'JKGB', 'J&K Grameen Bank'],
    ['rrb-jh', 'Jharkhand Gramin Bank', 'JGB'],
    ['rrb-ka', 'Karnataka Grameena Bank', 'KAGB'],
    ['rrb-kl', 'Kerala Grameena Bank', 'KGB'],
    ['rrb-mp', 'Madhya Pradesh Gramin Bank', 'MPGB'],
    ['rrb-mh', 'Maharashtra Gramin Bank', 'MGB'],
    ['rrb-mn', 'Manipur Rural Bank', 'MNRB'],
    ['rrb-ml', 'Meghalaya Rural Bank', 'MLRB'],
    ['rrb-mz', 'Mizoram Rural Bank', 'MZRB'],
    ['rrb-nl', 'Nagaland Rural Bank', 'NRB'],
    ['rrb-od', 'Odisha Grameen Bank', 'OGB'],
    ['rrb-py', 'Puducherry Grama Bank', 'PGB'],
    ['rrb-pb', 'Punjab Gramin Bank', 'PNGB'],
    ['rrb-rj', 'Rajasthan Gramin Bank', 'RGB'],
    ['rrb-tn', 'Tamil Nadu Grama Bank', 'TNGB'],
    ['rrb-tg', 'Telangana Grameena Bank', 'TGB'],
    ['rrb-tr', 'Tripura Gramin Bank', 'TRGB'],
    ['rrb-up', 'Uttar Pradesh Gramin Bank', 'UPGB'],
    ['rrb-uk', 'Uttarakhand Gramin Bank', 'UKGB'],
    ['rrb-wb', 'West Bengal Gramin Bank', 'WBGB'],
  ]),
  ...group('Foreign', [
    ['ab', 'AB Bank', 'AB'],
    ['amex', 'American Express Banking Corporation', 'AMEX'],
    ['anz', 'Australia and New Zealand Banking Group', 'ANZ', 'ANZ Bank'],
    ['bofa', 'Bank of America', 'BOFA'],
    ['bbk', 'Bank of Bahrain and Kuwait', 'BBK'],
    ['ceylon', 'Bank of Ceylon', 'BOCY'],
    ['scotia', 'Bank of Nova Scotia', 'BNS', 'Scotiabank'],
    ['china', 'Bank of China', 'BOC'],
    ['barclays', 'Barclays Bank', 'BARC'],
    ['bnp', 'BNP Paribas', 'BNP'],
    ['citi', 'Citibank', 'CITI', 'Citi Bank'],
    ['rabo', 'Cooperatieve Rabobank', 'RABO', 'Rabobank'],
    [
      'ca',
      'Credit Agricole Corporate and Investment Bank',
      'CA',
      'Crédit Agricole',
    ],
    ['ctbc', 'CTBC Bank', 'CTBC'],
    ['deutsche', 'Deutsche Bank', 'DB'],
    ['doha', 'Doha Bank', 'DOHA'],
    ['enbd', 'Emirates NBD Bank', 'ENBD'],
    ['fab', 'First Abu Dhabi Bank', 'FAB'],
    ['firstrand', 'FirstRand Bank', 'FRB'],
    [
      'hsbc',
      'HSBC Bank',
      'HSBC',
      'Hong Kong and Shanghai Banking Corporation',
      'Hongkong and Shanghai Banking Corporation',
    ],
    ['icbc', 'Industrial and Commercial Bank of China', 'ICBC'],
    ['ibk', 'Industrial Bank of Korea', 'IBK'],
    ['jpm', 'J.P. Morgan Chase Bank', 'JPM', 'JPMorgan Chase'],
    ['vtb', 'JSC VTB Bank', 'VTB'],
    ['hana', 'KEB Hana Bank', 'HANA'],
    ['kookmin', 'Kookmin Bank', 'KB'],
    ['mashreq', 'Mashreqbank', 'MASH', 'Mashreq Bank'],
    ['mizuho', 'Mizuho Bank', 'MIZ'],
    ['mufg', 'MUFG Bank', 'MUFG'],
    ['natwest', 'NatWest Markets', 'NW'],
    ['nh', 'NongHyup Bank', 'NH'],
    ['maybank', 'PT Bank Maybank Indonesia', 'MAY'],
    ['qnb', 'Qatar National Bank', 'QNB'],
    ['sber', 'Sberbank', 'SBER'],
    ['shinhan', 'Shinhan Bank', 'SHIN'],
    ['sg', 'Societe Generale', 'SG', 'Société Générale'],
    ['sonali', 'Sonali Bank', 'SON'],
    ['sc', 'Standard Chartered Bank', 'SC'],
    ['smbc', 'Sumitomo Mitsui Banking Corporation', 'SMBC'],
    ['uob', 'United Overseas Bank', 'UOB'],
    ['ubs', 'UBS AG', 'UBS'],
    ['woori', 'Woori Bank', 'WOORI'],
    ['dbs', 'DBS Bank India', 'DBS', 'DBS Bank'],
    ['sbm', 'SBM Bank India', 'SBM', 'SBM Bank (India)'],
  ]),
].sort((a, b) => a.name.localeCompare(b.name, 'en-IN'));

export function normalizeBankName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function findBank(name: string): BankEntry | undefined {
  const normalized = normalizeBankName(name).replace(/ (limited|ltd|plc)$/, '');
  return BANK_DIRECTORY.find(bank =>
    [bank.name, bank.abbreviation, ...bank.aliases].some(
      alias => normalizeBankName(alias) === normalized,
    ),
  );
}

export function bankAbbreviation(name: string): string {
  const bank = findBank(name);
  if (bank) return bank.abbreviation;
  const words = normalizeBankName(name)
    .split(' ')
    .filter(
      word =>
        word && !['the', 'of', 'and', 'limited', 'ltd', 'bank'].includes(word),
    );
  if (!words.length) return 'BK';
  if (words.length === 1)
    return Array.from(words[0]).slice(0, 4).join('').toUpperCase();
  return words
    .slice(0, 4)
    .map(word => Array.from(word)[0])
    .join('')
    .toUpperCase();
}

export function bankMatches(name: string, query: string): boolean {
  const bank = findBank(name);
  const haystack = normalizeBankName(
    [name, bankAbbreviation(name), bank?.name, ...(bank?.aliases ?? [])].join(
      ' ',
    ),
  );
  return normalizeBankName(query)
    .split(' ')
    .every(token => haystack.includes(token));
}

export interface BankOption {
  name: string;
  category: string;
  used: boolean;
}
export function bankOptions(usedNames: string[], query: string): BankOption[] {
  const used = new Map<string, BankOption>();
  usedNames
    .filter(name => name.trim())
    .forEach(name => {
      const key = normalizeBankName(name);
      if (!used.has(key))
        used.set(key, {
          name,
          category: findBank(name)?.category ?? 'Custom bank',
          used: true,
        });
    });
  const usedIds = new Set(
    [...used.values()].map(option => findBank(option.name)?.id).filter(Boolean),
  );
  return [
    ...used.values(),
    ...BANK_DIRECTORY.filter(bank => !usedIds.has(bank.id)).map(bank => ({
      name: bank.name,
      category: bank.category,
      used: false,
    })),
  ]
    .filter(option => bankMatches(option.name, query))
    .sort(
      (a, b) =>
        (!query.trim() ? Number(b.used) - Number(a.used) : 0) ||
        a.name.localeCompare(b.name, 'en-IN'),
    );
}
