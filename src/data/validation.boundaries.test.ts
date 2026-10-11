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
it('BUG-008 overflowing principal or installment must fail validation', () => {
  expect(validateFdDraft({ ...fd(), principalAmount: '1e309' }).principalAmount).toBeDefined();
  expect(validateRdDraft({ ...rd(), monthlyInstallment: '1e309' }).monthlyInstallment).toBeDefined();
});
