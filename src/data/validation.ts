// Pure Add/Edit form validation — no RN imports, so it's plain-Jest testable like
// backupSchema.ts. Screens call these on every keystroke to compute field errors, but
// only *display* an error once the user has interacted with that field (see the
// `touched` state in AddEditFdScreen/AddEditRdScreen) so a blank Add form doesn't open
// already covered in red.
//
// Before this existed, saving a draft ran straight through `Number(x) || 0` with no
// checks at all — a typo in Principal silently saved a ₹0 FD with no warning.

export type FieldErrors = Record<string, string>;

const MAX_REASONABLE_RATE = 30; // p.a. — comfortably above any real FD/RD rate; catches typos like "70" for "7.0"

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

/** Parses a form field the same permissive way the save path does (`Number(x) || 0`),
 *  but keeps the raw parse result so validation can tell "0" apart from "not a number". */
function toNumber(value: unknown): number {
  if (value === '' || value === undefined || value === null) return NaN;
  const n = Number(value);
  return n;
}

export function validateFdDraft(draft: Record<string, any>): FieldErrors {
  const errors: FieldErrors = {};

  if (isBlank(draft.fdNumber)) errors.fdNumber = 'FD number is required';
  if (isBlank(draft.bankName)) errors.bankName = 'Select a bank';

  const principal = toNumber(draft.principalAmount);
  if (isBlank(draft.principalAmount) || Number.isNaN(principal)) errors.principalAmount = 'Enter a valid amount';
  else if (principal <= 0) errors.principalAmount = 'Amount must be greater than 0';

  const rate = toNumber(draft.interestRate);
  if (isBlank(draft.interestRate) || Number.isNaN(rate)) errors.interestRate = 'Enter a valid rate';
  else if (rate < 0 || rate > MAX_REASONABLE_RATE) errors.interestRate = `Rate must be between 0 and ${MAX_REASONABLE_RATE}%`;

  const years = Number(draft.tenureYears) || 0;
  const months = Number(draft.tenureMonths) || 0;
  const days = Number(draft.tenureDays) || 0;
  if (years < 0 || months < 0 || days < 0) errors.tenureYears = 'Tenure cannot be negative';
  else if (years * 12 + months === 0 && days === 0) errors.tenureYears = 'Tenure must be greater than 0';

  if (!isBlank(draft.startDate) && !isBlank(draft.depositDate) && draft.depositDate > draft.startDate) {
    errors.depositDate = "Deposit date can't be after the start date";
  }

  return errors;
}

export function validateRdDraft(draft: Record<string, any>): FieldErrors {
  const errors: FieldErrors = {};

  if (isBlank(draft.rdNumber)) errors.rdNumber = 'RD number is required';
  if (isBlank(draft.bankName)) errors.bankName = 'Select a bank';

  const installment = toNumber(draft.monthlyInstallment);
  if (isBlank(draft.monthlyInstallment) || Number.isNaN(installment)) errors.monthlyInstallment = 'Enter a valid amount';
  else if (installment <= 0) errors.monthlyInstallment = 'Amount must be greater than 0';

  const rate = toNumber(draft.interestRate);
  if (isBlank(draft.interestRate) || Number.isNaN(rate)) errors.interestRate = 'Enter a valid rate';
  else if (rate < 0 || rate > MAX_REASONABLE_RATE) errors.interestRate = `Rate must be between 0 and ${MAX_REASONABLE_RATE}%`;

  const years = Number(draft.tenureYears) || 0;
  const months = Number(draft.tenureMonths) || 0;
  const totalMonths = years * 12 + months;
  if (years < 0 || months < 0) errors.tenureYears = 'Tenure cannot be negative';
  else if (totalMonths === 0) errors.tenureYears = 'Tenure must be greater than 0';

  const installmentsPaid = Number(draft.installmentsPaid) || 0;
  if (installmentsPaid < 0) errors.installmentsPaid = 'Cannot be negative';
  else if (totalMonths > 0 && installmentsPaid > totalMonths) errors.installmentsPaid = `Cannot exceed the ${totalMonths}-month tenure`;

  return errors;
}

export function isValidDraft(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
