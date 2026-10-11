import type { StoredFd, StoredRd } from '../../src/data/db';

export const NOW = new Date(2026, 5, 15, 12);
export function fd(overrides: Partial<StoredFd> = {}): StoredFd {
  return {
    id: 'fd-1', fdNumber: 'FD001', bankName: 'Test Bank', branch: 'Main',
    bankAccountNumber: '1234567890', customerId: 'SYNTHETIC', fdHolderName: 'Jane Doe',
    jointHolder: null, fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 100000, depositDate: '2026-01-01', startDate: '2026-01-01',
    tenureYears: 1, tenureMonths: 0, tenureDays: 0, interestRate: 7,
    interestType: 'Compound', compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity',
    interestCreditMethod: 'Reinvested into FD', autoRenewal: 'No', renewalOption: 'Do Not Renew',
    remarks: '', nominee: '', nomineeRelationship: '', tdsApplicable: 'Yes', tdsPercent: 10,
    panSubmitted: 'Yes', form15G: 'No', renewalCount: 0, ...overrides,
  };
}
export function rd(overrides: Partial<StoredRd> = {}): StoredRd {
  return {
    id: 'rd-1', rdNumber: 'RD001', bankName: 'Test Bank', branch: 'Main',
    bankAccountNumber: '1234567890', customerId: 'SYNTHETIC', rdHolderName: 'Jane Doe',
    jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 5000, startDate: '2026-01-01', tenureYears: 1, tenureMonths: 0,
    interestRate: 6.5, interestType: 'Compound', compoundingFrequency: 'Quarterly',
    installmentsPaid: 6, remarks: '', renewalCount: 0, ...overrides,
  };
}
