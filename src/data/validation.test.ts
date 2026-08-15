import { validateFdDraft, validateRdDraft, isValidDraft } from './validation';

function validFdDraft(overrides: Record<string, any> = {}) {
  return {
    fdNumber: 'FD001',
    bankName: 'HDFC Bank',
    principalAmount: '100000',
    startDate: '2026-01-01',
    depositDate: '2026-01-01',
    tenureYears: 1,
    tenureMonths: 0,
    tenureDays: 0,
    interestRate: '7',
    ...overrides,
  };
}

function validRdDraft(overrides: Record<string, any> = {}) {
  return {
    rdNumber: 'RD001',
    bankName: 'HDFC Bank',
    monthlyInstallment: '5000',
    tenureYears: 1,
    tenureMonths: 0,
    interestRate: '6.5',
    installmentsPaid: 0,
    ...overrides,
  };
}

describe('validateFdDraft', () => {
  it('accepts a fully filled-in draft', () => {
    expect(isValidDraft(validateFdDraft(validFdDraft()))).toBe(true);
  });

  it('requires fdNumber and bankName', () => {
    const errors = validateFdDraft(validFdDraft({ fdNumber: '', bankName: '' }));
    expect(errors.fdNumber).toBeTruthy();
    expect(errors.bankName).toBeTruthy();
  });

  it('rejects a non-numeric principal (the exact C2 bug: typing garbage silently saved ₹0)', () => {
    const errors = validateFdDraft(validFdDraft({ principalAmount: 'abc' }));
    expect(errors.principalAmount).toBeTruthy();
  });

  it('rejects a zero or negative principal', () => {
    expect(validateFdDraft(validFdDraft({ principalAmount: '0' })).principalAmount).toBeTruthy();
    expect(validateFdDraft(validFdDraft({ principalAmount: '-500' })).principalAmount).toBeTruthy();
  });

  it('rejects a rate outside 0-30%', () => {
    expect(validateFdDraft(validFdDraft({ interestRate: '-1' })).interestRate).toBeTruthy();
    expect(validateFdDraft(validFdDraft({ interestRate: '35' })).interestRate).toBeTruthy();
  });

  it('accepts a rate of exactly 0 or 30', () => {
    expect(validateFdDraft(validFdDraft({ interestRate: '0' })).interestRate).toBeUndefined();
    expect(validateFdDraft(validFdDraft({ interestRate: '30' })).interestRate).toBeUndefined();
  });

  it('rejects a zero tenure (all of years/months/days blank or 0)', () => {
    const errors = validateFdDraft(validFdDraft({ tenureYears: 0, tenureMonths: 0, tenureDays: 0 }));
    expect(errors.tenureYears).toBeTruthy();
  });

  it('accepts a tenure expressed only in days', () => {
    const errors = validateFdDraft(validFdDraft({ tenureYears: 0, tenureMonths: 0, tenureDays: 15 }));
    expect(errors.tenureYears).toBeUndefined();
  });

  it('rejects a deposit date after the start date', () => {
    const errors = validateFdDraft(validFdDraft({ startDate: '2026-01-01', depositDate: '2026-02-01' }));
    expect(errors.depositDate).toBeTruthy();
  });
});

describe('validateRdDraft', () => {
  it('accepts a fully filled-in draft', () => {
    expect(isValidDraft(validateRdDraft(validRdDraft()))).toBe(true);
  });

  it('requires rdNumber and bankName', () => {
    const errors = validateRdDraft(validRdDraft({ rdNumber: '', bankName: '' }));
    expect(errors.rdNumber).toBeTruthy();
    expect(errors.bankName).toBeTruthy();
  });

  it('rejects a non-numeric or non-positive monthly instalment', () => {
    expect(validateRdDraft(validRdDraft({ monthlyInstallment: 'abc' })).monthlyInstallment).toBeTruthy();
    expect(validateRdDraft(validRdDraft({ monthlyInstallment: '0' })).monthlyInstallment).toBeTruthy();
  });

  it('rejects a zero tenure', () => {
    expect(validateRdDraft(validRdDraft({ tenureYears: 0, tenureMonths: 0 })).tenureYears).toBeTruthy();
  });

  it('rejects installmentsPaid greater than the total tenure in months', () => {
    const errors = validateRdDraft(validRdDraft({ tenureYears: 1, tenureMonths: 0, installmentsPaid: 15 }));
    expect(errors.installmentsPaid).toBeTruthy();
  });

  it('accepts installmentsPaid equal to the full tenure', () => {
    const errors = validateRdDraft(validRdDraft({ tenureYears: 1, tenureMonths: 0, installmentsPaid: 12 }));
    expect(errors.installmentsPaid).toBeUndefined();
  });
});
