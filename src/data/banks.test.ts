import {
  BANK_DIRECTORY,
  bankAbbreviation,
  bankMatches,
  bankOptions,
  findBank,
  normalizeBankName,
} from './banks';

describe('offline bank directory', () => {
  it('covers the five official categories without duplicate names or IDs', () => {
    expect(new Set(BANK_DIRECTORY.map(bank => bank.id)).size).toBe(
      BANK_DIRECTORY.length,
    );
    expect(
      new Set(BANK_DIRECTORY.map(bank => normalizeBankName(bank.name))).size,
    ).toBe(BANK_DIRECTORY.length);
    expect(
      BANK_DIRECTORY.reduce<Record<string, number>>(
        (counts, bank) => ({
          ...counts,
          [bank.category]: (counts[bank.category] || 0) + 1,
        }),
        {},
      ),
    ).toEqual({
      'Public sector': 12,
      'Private sector': 21,
      'Small finance': 11,
      'Regional rural': 28,
      Foreign: 44,
    });
    expect(BANK_DIRECTORY.every(bank => bank.abbreviation.length <= 5)).toBe(
      true,
    );
    expect(BANK_DIRECTORY.some(bank => bank.name.includes('Payments'))).toBe(
      false,
    );
  });
  it.each([
    ['State Bank of India', 'SBI'],
    ['HDFC Bank', 'HDFC'],
    ['ICICI Bank', 'ICICI'],
    ['Punjab National Bank', 'PNB'],
    ['HSBC Bank', 'HSBC'],
    ['Catholic Syrian Bank', 'CSB'],
  ])('renders the familiar abbreviation for %s', (name, abbreviation) => {
    expect(bankAbbreviation(name)).toBe(abbreviation);
    expect(bankMatches(name, abbreviation.toLowerCase())).toBe(true);
  });
  it('searches aliases, punctuation, case, and multiple tokens', () => {
    expect(findBank('  HDFC BANK LIMITED  ')?.id).toBe('hdfc');
    expect(findBank('J&K Bank')?.id).toBe('jkb');
    expect(bankOptions([], '  sbi  ').map(option => option.name)).toEqual([
      'State Bank of India',
    ]);
    expect(bankMatches('HSBC Bank', 'Shanghai')).toBe(true);
    expect(bankMatches('slice Small Finance Bank', 'north east')).toBe(true);
    expect(bankMatches('Société Générale', 'societe')).toBe(true);
    expect(bankOptions([], 'zzzzzz')).toEqual([]);
  });
  it('prioritizes used banks and retains stored/custom spelling without duplicates', () => {
    const options = bankOptions(
      ['My Cooperative Bank', 'SBI', 'My Cooperative Bank'],
      '',
    );
    expect(options.slice(0, 2).map(option => option.name)).toEqual([
      'My Cooperative Bank',
      'SBI',
    ]);
    expect(
      options.filter(option => findBank(option.name)?.id === 'sbi'),
    ).toHaveLength(1);
    expect(
      bankOptions(['My Cooperative Bank'], 'cooperative')[0],
    ).toMatchObject({ name: 'My Cooperative Bank', used: true });
    const searched = bankOptions(['Yes Bank'], 'bank');
    expect(searched.map(option => option.name)).toEqual(
      searched
        .map(option => option.name)
        .sort((a, b) => a.localeCompare(b, 'en-IN')),
    );
  });
  it('provides deterministic bounded custom initials, including Unicode and empty names', () => {
    expect(bankAbbreviation('My Cooperative Bank')).toBe('MC');
    expect(bankAbbreviation('  MY  Cooperative BANK ')).toBe('MC');
    expect(bankAbbreviation('Acme')).toBe('ACME');
    expect(bankAbbreviation('தமிழ் வங்கி')).not.toBe('BK');
    expect(bankAbbreviation('  ')).toBe('BK');
    expect(bankAbbreviation('Bank')).toBe('BK');
  });
});
