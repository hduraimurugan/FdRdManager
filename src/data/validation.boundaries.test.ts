import { validateFdDraft, validateRdDraft, isValidDraft } from './validation';
import { fd, rd } from '../../tests/support/fixtures';
it.each([-1, -12])('VAL-001 negative tenure %i is rejected for both deposit types', tenureYears => {
  expect(validateFdDraft(fd({ tenureYears })).tenureYears).toBeDefined();
  expect(validateRdDraft(rd({ tenureYears })).tenureYears).toBeDefined();
});
it('VAL-002 blank, NaN and rate bounds fail consistently for RD', () => {
  for (const rate of ['', 'garbage', -1, 31]) expect(validateRdDraft({ ...rd(), interestRate: rate }).interestRate).toBeDefined();
  expect(validateRdDraft(rd({ installmentsPaid: -1 })).installmentsPaid).toBeDefined();
  expect(isValidDraft({ field: 'invalid' })).toBe(false);
  expect(isValidDraft({})).toBe(true);
});
describe('BUG-008 non-finite amounts must fail validation', () => {
  const amounts = ['1e309', '-1e309', 'Infinity', '-Infinity', Infinity, -Infinity, NaN];
  it.each(amounts)('rejects FD principal %s', principalAmount => {
    expect(validateFdDraft({ ...fd(), principalAmount }).principalAmount).toBe('Enter a valid amount');
  });
  it.each(amounts)('rejects RD installment %s', monthlyInstallment => {
    expect(validateRdDraft({ ...rd(), monthlyInstallment }).monthlyInstallment).toBe('Enter a valid amount');
  });
  it.each(['0.01', '100000', '1e6'])('accepts finite positive amount %s for both forms', amount => {
    expect(validateFdDraft({ ...fd(), principalAmount: amount }).principalAmount).toBeUndefined();
    expect(validateRdDraft({ ...rd(), monthlyInstallment: amount }).monthlyInstallment).toBeUndefined();
  });
});
