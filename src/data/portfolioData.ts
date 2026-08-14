// FD/RD Portfolio Manager — mock data & shared calculation helpers
// Ported from the Claude Design prototype's `portfolio-data.js`.

export interface FixedDeposit {
  id: string;
  fdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  fdHolderName: string;
  jointHolder: string | null;
  fdType: string;
  mode: string;
  status: string;
  principalAmount: number;
  depositDate: string;
  startDate: string;
  maturityDate: string;
  tenureYears: number;
  tenureMonths: number;
  tenureDays: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  interestPayoutMode: string;
  interestCreditMethod: string;
  autoRenewal: string;
  renewalOption: string;
  remarks: string;
  maturityAmount: number;
  currentValue: number;
  interestEarnedTotal: number;
  interestEarnedSoFar: number;
  daysRemaining: number;
  totalDays: number;
  elapsedDays: number;
  nextPayoutAmount: number | null;
  nextPayoutDate: string | null;
  isPayoutFD: boolean;
  nominee: string;
  nomineeRelationship: string;
  tdsApplicable: string;
  tdsPercent: number;
  panSubmitted: string;
  form15G: string;
  actionNeeded?: string | null;
  payoutOverdue?: boolean;
  renewalCount?: number;
}

export interface RecurringDeposit {
  id: string;
  rdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  rdHolderName: string;
  jointHolder: string | null;
  rdType: string;
  mode: string;
  status: string;
  monthlyInstallment: number;
  startDate: string;
  maturityDate: string;
  tenureYears: number;
  tenureMonths: number;
  totalMonths: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  maturityAmount: number;
  totalDeposited: number;
  interestEarnedSoFar: number;
  interestEarnedTotal: number;
  currentValue: number;
  installmentsTotal: number;
  installmentsPaid: number;
  installmentsMissed: number;
  nextInstallmentDate: string | null;
  daysRemaining: number;
  remarks: string;
  autoDebit: string;
  renewalCount?: number;
}

export interface PortfolioEvent {
  id: string;
  kind: 'FD' | 'RD';
  number: string;
  bank: string;
  type: string;
  amount: number;
  date: string;
  recordId: string;
  overdue: boolean;
}

export interface PortfolioNotification {
  id: string;
  icon: 'alert' | 'clock' | 'wallet' | 'refresh';
  severity: 'high' | 'medium';
  title: string;
  subtitle: string;
  date: string;
  recordType: 'FD' | 'RD';
  recordId: string;
}

export const TODAY = new Date('2026-08-10');
export const BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Yes Bank',
  'IDFC First Bank',
  'Canara Bank',
];
export const FD_TYPES = ['Regular', 'Senior Citizen', 'Tax Saver', 'NRE', 'NRO', 'Corporate'];
export const RD_TYPES = ['Regular', 'Senior Citizen'];
export const STATUSES = ['Active', 'Matured', 'Closed', 'Prematurely Closed'];
export const COMPOUNDING_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
export const PAYOUT_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'At Maturity'];
export const CREDIT_METHODS = ['Credited to Savings Account', 'Reinvested into FD'];

export const initialFdList: FixedDeposit[] = [
  {
    id: 'fd-1', fdNumber: 'FD001', bankName: 'HDFC Bank', branch: 'Bandra (Mumbai)',
    bankAccountNumber: '501001000000', customerId: 'HDFC10000', fdHolderName: 'Arun Sharma',
    jointHolder: 'Priya Sharma', fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 500000, depositDate: '2024-06-01', startDate: '2024-06-05', maturityDate: '2027-06-05',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.1, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Long-term growth FD',
    maturityAmount: 617538, currentValue: 582942, interestEarnedTotal: 117538, interestEarnedSoFar: 82942,
    daysRemaining: 299, totalDays: 1095, elapsedDays: 796, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Priya Sharma', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-2', fdNumber: 'FD002', bankName: 'State Bank of India', branch: 'Connaught Place (New Delhi)',
    bankAccountNumber: '501008654321', customerId: 'STAT10777', fdHolderName: 'Meera Iyer',
    jointHolder: 'Rajesh Iyer', fdType: 'Senior Citizen', mode: 'Offline', status: 'Active',
    principalAmount: 1000000, depositDate: '2023-08-10', startDate: '2023-08-14', maturityDate: '2026-08-14',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.5, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'Yes', renewalOption: 'Renew Principal Only', remarks: 'Matures in days - urgent',
    maturityAmount: 1249716, currentValue: 1248953, interestEarnedTotal: 249716, interestEarnedSoFar: 248953,
    daysRemaining: 4, totalDays: 1096, elapsedDays: 1092, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Rajesh Iyer', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-3', fdNumber: 'FD003', bankName: 'ICICI Bank', branch: 'MG Road (Bengaluru)',
    bankAccountNumber: '5010016308642', customerId: 'ICIC11554', fdHolderName: 'Vikram Rao',
    jointHolder: null, fdType: 'Tax Saver', mode: 'Online', status: 'Active',
    principalAmount: 150000, depositDate: '2021-08-12', startDate: '2021-08-16', maturityDate: '2026-08-16',
    tenureYears: 5, tenureMonths: 0, tenureDays: 0, interestRate: 6.9, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Tax saver lock-in',
    maturityAmount: 211176, currentValue: 210979, interestEarnedTotal: 61176, interestEarnedSoFar: 60979,
    daysRemaining: 6, totalDays: 1826, elapsedDays: 1820, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Vikram Rao', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-4', fdNumber: 'FD004', bankName: 'Axis Bank', branch: 'Andheri (Mumbai)',
    bankAccountNumber: '5010023962963', customerId: 'AXIS12331', fdHolderName: 'Kavita Nair',
    jointHolder: 'Sunil Nair', fdType: 'Regular', mode: 'Online', status: 'Matured',
    principalAmount: 200000, depositDate: '2023-07-20', startDate: '2023-07-24', maturityDate: '2026-07-24',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 6.5, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Matured - renewal decision pending',
    maturityAmount: 242682, currentValue: 242682, interestEarnedTotal: 42682, interestEarnedSoFar: 42682,
    daysRemaining: -17, totalDays: 1096, elapsedDays: 1096, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Sunil Nair', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No', actionNeeded: 'renewal_pending',
  },
  {
    id: 'fd-5', fdNumber: 'FD005', bankName: 'Kotak Mahindra Bank', branch: 'Park Street (Kolkata)',
    bankAccountNumber: '5010031617284', customerId: 'KOTA13108', fdHolderName: 'Deepak Ghosh',
    jointHolder: 'Ritu Ghosh', fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 750000, depositDate: '2024-02-14', startDate: '2024-02-19', maturityDate: '2027-02-19',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.2, interestType: 'Compound',
    compoundingFrequency: 'Half-Yearly', interestPayoutMode: 'Half-Yearly', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Payout due this week',
    maturityAmount: 750000, currentValue: 750000, interestEarnedTotal: 162000, interestEarnedSoFar: 108000,
    daysRemaining: 193, totalDays: 1096, elapsedDays: 903, nextPayoutAmount: 27000, nextPayoutDate: '2026-08-19',
    isPayoutFD: true, nominee: 'Ritu Ghosh', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-6', fdNumber: 'FD006', bankName: 'Punjab National Bank', branch: 'Civil Lines (Lucknow)',
    bankAccountNumber: '5010039271605', customerId: 'PUNJ13885', fdHolderName: 'Suresh Verma',
    jointHolder: 'Anita Verma', fdType: 'Regular', mode: 'Offline', status: 'Active',
    principalAmount: 300000, depositDate: '2025-08-05', startDate: '2025-08-09', maturityDate: '2027-08-09',
    tenureYears: 2, tenureMonths: 0, tenureDays: 0, interestRate: 6.8, interestType: 'Compound',
    compoundingFrequency: 'Monthly', interestPayoutMode: 'Monthly', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Monthly income FD',
    maturityAmount: 300000, currentValue: 300000, interestEarnedTotal: 40800, interestEarnedSoFar: 20400,
    daysRemaining: 364, totalDays: 730, elapsedDays: 366, nextPayoutAmount: 1700, nextPayoutDate: '2026-09-09',
    isPayoutFD: true, nominee: 'Anita Verma', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-7', fdNumber: 'FD007', bankName: 'Bank of Baroda', branch: 'CG Road (Ahmedabad)',
    bankAccountNumber: '5010046925926', customerId: 'BANK14662', fdHolderName: 'Manoj Patel',
    jointHolder: null, fdType: 'Regular', mode: 'Offline', status: 'Closed',
    principalAmount: 100000, depositDate: '2024-01-18', startDate: '2024-01-22', maturityDate: '2026-01-22',
    tenureYears: 2, tenureMonths: 0, tenureDays: 0, interestRate: 6.25, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Closed early - penalty applied',
    maturityAmount: 113205, currentValue: 100000, interestEarnedTotal: 13205, interestEarnedSoFar: 0,
    daysRemaining: -200, totalDays: 731, elapsedDays: 731, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Manoj Patel', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-8', fdNumber: 'FD008', bankName: 'Yes Bank', branch: 'Bandra (Mumbai)',
    bankAccountNumber: '5010054580247', customerId: 'YES15439', fdHolderName: 'Rohit Malhotra',
    jointHolder: 'Sneha Malhotra', fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 400000, depositDate: '2023-08-25', startDate: '2023-08-29', maturityDate: '2026-08-29',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.35, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'Yes', renewalOption: 'Renew Principal + Interest', remarks: 'Maturity this month',
    maturityAmount: 497683, currentValue: 495899, interestEarnedTotal: 97683, interestEarnedSoFar: 95899,
    daysRemaining: 19, totalDays: 1096, elapsedDays: 1077, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Sneha Malhotra', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-9', fdNumber: 'FD009', bankName: 'IDFC First Bank', branch: 'Koramangala (Bengaluru)',
    bankAccountNumber: '5010062234568', customerId: 'IDFC16216', fdHolderName: 'Lakshmi Menon',
    jointHolder: null, fdType: 'Senior Citizen', mode: 'Online', status: 'Active',
    principalAmount: 600000, depositDate: '2024-05-02', startDate: '2024-05-06', maturityDate: '2027-05-06',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.65, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Senior citizen premium rate',
    maturityAmount: 753149, currentValue: 712240, interestEarnedTotal: 153149, interestEarnedSoFar: 112240,
    daysRemaining: 269, totalDays: 1095, elapsedDays: 826, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Lakshmi Menon', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-10', fdNumber: 'FD010', bankName: 'Canara Bank', branch: 'Salt Lake (Kolkata)',
    bankAccountNumber: '5010069888889', customerId: 'CANA16993', fdHolderName: 'Ramesh Chandra',
    jointHolder: null, fdType: 'Regular', mode: 'Offline', status: 'Active',
    principalAmount: 250000, depositDate: '2025-01-10', startDate: '2025-01-14', maturityDate: '2028-01-14',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 6.75, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: '',
    maturityAmount: 305598, currentValue: 277700, interestEarnedTotal: 55598, interestEarnedSoFar: 27700,
    daysRemaining: 522, totalDays: 1095, elapsedDays: 573, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Ramesh Chandra', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-11', fdNumber: 'FD011', bankName: 'HDFC Bank', branch: 'Bandra (Mumbai)',
    bankAccountNumber: '5010077543210', customerId: 'HDFC17770', fdHolderName: 'Arun Sharma',
    jointHolder: null, fdType: 'Tax Saver', mode: 'Online', status: 'Active',
    principalAmount: 150000, depositDate: '2023-03-01', startDate: '2023-03-05', maturityDate: '2028-03-05',
    tenureYears: 5, tenureMonths: 0, tenureDays: 0, interestRate: 6.9, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Tax saver - 2nd FD',
    maturityAmount: 211176, currentValue: 189743, interestEarnedTotal: 61176, interestEarnedSoFar: 39743,
    daysRemaining: 573, totalDays: 1827, elapsedDays: 1254, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Arun Sharma', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-12', fdNumber: 'FD012', bankName: 'ICICI Bank', branch: 'MG Road (Bengaluru)',
    bankAccountNumber: '5010085197531', customerId: 'ICIC18547', fdHolderName: 'Vikram Rao',
    jointHolder: 'Anjali Rao', fdType: 'Regular', mode: 'Online', status: 'Prematurely Closed',
    principalAmount: 350000, depositDate: '2024-04-01', startDate: '2024-04-05', maturityDate: '2027-04-05',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Withdrawn early for medical expense',
    maturityAmount: 431004, currentValue: 350000, interestEarnedTotal: 81004, interestEarnedSoFar: 0,
    daysRemaining: 238, totalDays: 1095, elapsedDays: 857, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Anjali Rao', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-13', fdNumber: 'FD013', bankName: 'State Bank of India', branch: 'Connaught Place (New Delhi)',
    bankAccountNumber: '5010092851852', customerId: 'STAT19324', fdHolderName: 'Meera Iyer',
    jointHolder: null, fdType: 'Regular', mode: 'Offline', status: 'Active',
    principalAmount: 550000, depositDate: '2025-05-01', startDate: '2025-05-05', maturityDate: '2028-05-05',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'Quarterly', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Quarterly payout',
    maturityAmount: 550000, currentValue: 550000, interestEarnedTotal: 115500, interestEarnedSoFar: 48125,
    daysRemaining: 634, totalDays: 1096, elapsedDays: 462, nextPayoutAmount: 9625, nextPayoutDate: '2026-11-05',
    isPayoutFD: true, nominee: 'Meera Iyer', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-14', fdNumber: 'FD014', bankName: 'Axis Bank', branch: 'Andheri (Mumbai)',
    bankAccountNumber: '50100100506173', customerId: 'AXIS20101', fdHolderName: 'Kavita Nair',
    jointHolder: 'Sunil Nair', fdType: 'Senior Citizen', mode: 'Online', status: 'Active',
    principalAmount: 800000, depositDate: '2023-08-09', startDate: '2023-08-13', maturityDate: '2026-08-13',
    tenureYears: 3, tenureMonths: 0, tenureDays: 0, interestRate: 7.8, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'Yes', renewalOption: 'Renew Principal Only', remarks: 'Matures in 3 days',
    maturityAmount: 1008641, currentValue: 1008214, interestEarnedTotal: 208641, interestEarnedSoFar: 208214,
    daysRemaining: 3, totalDays: 1096, elapsedDays: 1093, nextPayoutAmount: null, nextPayoutDate: null,
    isPayoutFD: false, nominee: 'Sunil Nair', nomineeRelationship: 'Spouse', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No',
  },
  {
    id: 'fd-15', fdNumber: 'FD015', bankName: 'Kotak Mahindra Bank', branch: 'Park Street (Kolkata)',
    bankAccountNumber: '50100108160494', customerId: 'KOTA20878', fdHolderName: 'Deepak Ghosh',
    jointHolder: null, fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 200000, depositDate: '2025-02-01', startDate: '2025-02-05', maturityDate: '2027-02-05',
    tenureYears: 2, tenureMonths: 0, tenureDays: 0, interestRate: 6.95, interestType: 'Compound',
    compoundingFrequency: 'Monthly', interestPayoutMode: 'Monthly', interestCreditMethod: 'Credited to Savings Account',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: 'Interest overdue - credit pending',
    maturityAmount: 200000, currentValue: 200000, interestEarnedTotal: 27800, interestEarnedSoFar: 20850,
    daysRemaining: 179, totalDays: 730, elapsedDays: 551, nextPayoutAmount: 1158, nextPayoutDate: '2026-08-05',
    isPayoutFD: true, nominee: 'Deepak Ghosh', nomineeRelationship: 'Self', tdsApplicable: 'Yes',
    tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No', payoutOverdue: true,
  },
];

export const initialRdList: RecurringDeposit[] = [
  {
    id: 'rd-1', rdNumber: 'RD001', bankName: 'HDFC Bank', branch: 'Bandra (Mumbai)',
    bankAccountNumber: '602002000000', customerId: 'HDFC20000', rdHolderName: 'Arun Sharma',
    jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 10000, startDate: '2024-09-10', maturityDate: '2027-09-10',
    tenureYears: 3, tenureMonths: 0, totalMonths: 36, interestRate: 6.5, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 396075, totalDeposited: 220000,
    interestEarnedSoFar: 13704, interestEarnedTotal: 36075, currentValue: 233704,
    installmentsTotal: 36, installmentsPaid: 22, installmentsMissed: 0, nextInstallmentDate: '2026-08-10',
    daysRemaining: 396, remarks: 'Long-term savings goal', autoDebit: 'Yes',
  },
  {
    id: 'rd-2', rdNumber: 'RD002', bankName: 'ICICI Bank', branch: 'MG Road (Bengaluru)',
    bankAccountNumber: '6020010123456', customerId: 'ICIC20555', rdHolderName: 'Vikram Rao',
    jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 5000, startDate: '2025-08-16', maturityDate: '2027-08-16',
    tenureYears: 2, tenureMonths: 0, totalMonths: 24, interestRate: 6.75, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 128438, totalDeposited: 55000,
    interestEarnedSoFar: 1856, interestEarnedTotal: 8438, currentValue: 56856,
    installmentsTotal: 24, installmentsPaid: 11, installmentsMissed: 0, nextInstallmentDate: '2026-08-16',
    daysRemaining: 371, remarks: 'Installment due this week', autoDebit: 'Yes',
  },
  {
    id: 'rd-3', rdNumber: 'RD003', bankName: 'State Bank of India', branch: 'Connaught Place (New Delhi)',
    bankAccountNumber: '6020018246912', customerId: 'STAT21110', rdHolderName: 'Meera Iyer',
    jointHolder: 'Rajesh Iyer', rdType: 'Senior Citizen', mode: 'Offline', status: 'Active',
    monthlyInstallment: 15000, startDate: '2023-08-20', maturityDate: '2028-08-20',
    tenureYears: 5, tenureMonths: 0, totalMonths: 60, interestRate: 7, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 1060125, totalDeposited: 525000,
    interestEarnedSoFar: 55125, interestEarnedTotal: 160125, currentValue: 580125,
    installmentsTotal: 60, installmentsPaid: 35, installmentsMissed: 0, nextInstallmentDate: '2026-08-20',
    daysRemaining: 741, remarks: 'Retirement corpus', autoDebit: 'No',
  },
  {
    id: 'rd-4', rdNumber: 'RD004', bankName: 'Axis Bank', branch: 'Andheri (Mumbai)',
    bankAccountNumber: '6020026370368', customerId: 'AXIS21665', rdHolderName: 'Kavita Nair',
    jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Matured',
    monthlyInstallment: 8000, startDate: '2023-08-05', maturityDate: '2026-08-05',
    tenureYears: 3, tenureMonths: 0, totalMonths: 36, interestRate: 6.3, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 315972, totalDeposited: 288000,
    interestEarnedSoFar: 27972, interestEarnedTotal: 27972, currentValue: 315972,
    installmentsTotal: 36, installmentsPaid: 36, installmentsMissed: 0, nextInstallmentDate: null,
    daysRemaining: -5, remarks: 'Matured - awaiting payout', autoDebit: 'Yes',
  },
  {
    id: 'rd-5', rdNumber: 'RD005', bankName: 'Kotak Mahindra Bank', branch: 'Park Street (Kolkata)',
    bankAccountNumber: '6020034493824', customerId: 'KOTA22220', rdHolderName: 'Deepak Ghosh',
    jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 20000, startDate: '2025-08-25', maturityDate: '2026-08-25',
    tenureYears: 1, tenureMonths: 0, totalMonths: 12, interestRate: 6.6, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 248580, totalDeposited: 220000,
    interestEarnedSoFar: 7260, interestEarnedTotal: 8580, currentValue: 227260,
    installmentsTotal: 12, installmentsPaid: 11, installmentsMissed: 0, nextInstallmentDate: '2026-08-25',
    daysRemaining: 15, remarks: 'Matures this month', autoDebit: 'Yes',
  },
  {
    id: 'rd-6', rdNumber: 'RD006', bankName: 'Punjab National Bank', branch: 'Civil Lines (Lucknow)',
    bankAccountNumber: '6020042617280', customerId: 'PUNJ22775', rdHolderName: 'Suresh Verma',
    jointHolder: 'Anita Verma', rdType: 'Regular', mode: 'Offline', status: 'Active',
    monthlyInstallment: 7500, startDate: '2024-11-12', maturityDate: '2027-11-12',
    tenureYears: 3, tenureMonths: 0, totalMonths: 36, interestRate: 6.4, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 296640, totalDeposited: 150000,
    interestEarnedSoFar: 8400, interestEarnedTotal: 26640, currentValue: 158400,
    installmentsTotal: 36, installmentsPaid: 20, installmentsMissed: 1, nextInstallmentDate: '2026-08-12',
    daysRemaining: 459, remarks: '1 installment missed', autoDebit: 'No',
  },
  {
    id: 'rd-7', rdNumber: 'RD007', bankName: 'Canara Bank', branch: 'Salt Lake (Kolkata)',
    bankAccountNumber: '6020050740736', customerId: 'CANA23330', rdHolderName: 'Ramesh Chandra',
    jointHolder: null, rdType: 'Regular', mode: 'Offline', status: 'Closed',
    monthlyInstallment: 5000, startDate: '2022-06-01', maturityDate: '2024-06-01',
    tenureYears: 2, tenureMonths: 0, totalMonths: 24, interestRate: 6.1, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 127625, totalDeposited: 120000,
    interestEarnedSoFar: 7625, interestEarnedTotal: 7625, currentValue: 127625,
    installmentsTotal: 24, installmentsPaid: 24, installmentsMissed: 0, nextInstallmentDate: null,
    daysRemaining: -800, remarks: 'Closed on completion', autoDebit: 'No',
  },
  {
    id: 'rd-8', rdNumber: 'RD008', bankName: 'Yes Bank', branch: 'Bandra (Mumbai)',
    bankAccountNumber: '6020058864192', customerId: 'YES23885', rdHolderName: 'Rohit Malhotra',
    jointHolder: 'Sneha Malhotra', rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 12000, startDate: '2025-01-15', maturityDate: '2027-07-15',
    tenureYears: 2, tenureMonths: 6, totalMonths: 30, interestRate: 6.85, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', maturityAmount: 391853, totalDeposited: 216000,
    interestEarnedSoFar: 11713, interestEarnedTotal: 31853, currentValue: 227713,
    installmentsTotal: 30, installmentsPaid: 18, installmentsMissed: 0, nextInstallmentDate: '2026-08-15',
    daysRemaining: 339, remarks: '', autoDebit: 'Yes',
  },
];

export const initialEvents: PortfolioEvent[] = [
  { id: 'ev-fd-int-fd-15', kind: 'FD', number: 'FD015', bank: 'Kotak Mahindra Bank', type: 'Interest Overdue', amount: 1158, date: '2026-08-05', recordId: 'fd-15', overdue: true },
  { id: 'ev-rd-inst-rd-1', kind: 'RD', number: 'RD001', bank: 'HDFC Bank', type: 'Installment Due', amount: 10000, date: '2026-08-10', recordId: 'rd-1', overdue: false },
  { id: 'ev-rd-inst-rd-6', kind: 'RD', number: 'RD006', bank: 'Punjab National Bank', type: 'Installment Due', amount: 7500, date: '2026-08-12', recordId: 'rd-6', overdue: false },
  { id: 'ev-fd-mat-fd-14', kind: 'FD', number: 'FD014', bank: 'Axis Bank', type: 'Maturity (P+I)', amount: 1008641, date: '2026-08-13', recordId: 'fd-14', overdue: false },
  { id: 'ev-fd-mat-fd-2', kind: 'FD', number: 'FD002', bank: 'State Bank of India', type: 'Maturity (P+I)', amount: 1249716, date: '2026-08-14', recordId: 'fd-2', overdue: false },
  { id: 'ev-rd-inst-rd-8', kind: 'RD', number: 'RD008', bank: 'Yes Bank', type: 'Installment Due', amount: 12000, date: '2026-08-15', recordId: 'rd-8', overdue: false },
  { id: 'ev-fd-mat-fd-3', kind: 'FD', number: 'FD003', bank: 'ICICI Bank', type: 'Maturity (P+I)', amount: 211176, date: '2026-08-16', recordId: 'fd-3', overdue: false },
  { id: 'ev-rd-inst-rd-2', kind: 'RD', number: 'RD002', bank: 'ICICI Bank', type: 'Installment Due', amount: 5000, date: '2026-08-16', recordId: 'rd-2', overdue: false },
  { id: 'ev-fd-int-fd-5', kind: 'FD', number: 'FD005', bank: 'Kotak Mahindra Bank', type: 'Interest', amount: 27000, date: '2026-08-19', recordId: 'fd-5', overdue: false },
  { id: 'ev-rd-inst-rd-3', kind: 'RD', number: 'RD003', bank: 'State Bank of India', type: 'Installment Due', amount: 15000, date: '2026-08-20', recordId: 'rd-3', overdue: false },
  { id: 'ev-rd-inst-rd-5', kind: 'RD', number: 'RD005', bank: 'Kotak Mahindra Bank', type: 'Installment Due', amount: 20000, date: '2026-08-25', recordId: 'rd-5', overdue: false },
  { id: 'ev-rd-mat-rd-5', kind: 'RD', number: 'RD005', bank: 'Kotak Mahindra Bank', type: 'Maturity (P+I)', amount: 248580, date: '2026-08-25', recordId: 'rd-5', overdue: false },
  { id: 'ev-fd-mat-fd-8', kind: 'FD', number: 'FD008', bank: 'Yes Bank', type: 'Maturity (P+I)', amount: 497683, date: '2026-08-29', recordId: 'fd-8', overdue: false },
  { id: 'ev-fd-int-fd-6', kind: 'FD', number: 'FD006', bank: 'Punjab National Bank', type: 'Interest', amount: 1700, date: '2026-09-09', recordId: 'fd-6', overdue: false },
  { id: 'ev-fd-int-fd-13', kind: 'FD', number: 'FD013', bank: 'State Bank of India', type: 'Interest', amount: 9625, date: '2026-11-05', recordId: 'fd-13', overdue: false },
  { id: 'ev-fd-mat-fd-15', kind: 'FD', number: 'FD015', bank: 'Kotak Mahindra Bank', type: 'Maturity (P+I)', amount: 200000, date: '2027-02-05', recordId: 'fd-15', overdue: false },
  { id: 'ev-fd-mat-fd-5', kind: 'FD', number: 'FD005', bank: 'Kotak Mahindra Bank', type: 'Maturity (P+I)', amount: 750000, date: '2027-02-19', recordId: 'fd-5', overdue: false },
  { id: 'ev-fd-mat-fd-9', kind: 'FD', number: 'FD009', bank: 'IDFC First Bank', type: 'Maturity (P+I)', amount: 753149, date: '2027-05-06', recordId: 'fd-9', overdue: false },
  { id: 'ev-fd-mat-fd-1', kind: 'FD', number: 'FD001', bank: 'HDFC Bank', type: 'Maturity (P+I)', amount: 617538, date: '2027-06-05', recordId: 'fd-1', overdue: false },
  { id: 'ev-rd-mat-rd-8', kind: 'RD', number: 'RD008', bank: 'Yes Bank', type: 'Maturity (P+I)', amount: 391853, date: '2027-07-15', recordId: 'rd-8', overdue: false },
  { id: 'ev-fd-mat-fd-6', kind: 'FD', number: 'FD006', bank: 'Punjab National Bank', type: 'Maturity (P+I)', amount: 300000, date: '2027-08-09', recordId: 'fd-6', overdue: false },
  { id: 'ev-rd-mat-rd-2', kind: 'RD', number: 'RD002', bank: 'ICICI Bank', type: 'Maturity (P+I)', amount: 128438, date: '2027-08-16', recordId: 'rd-2', overdue: false },
  { id: 'ev-rd-mat-rd-1', kind: 'RD', number: 'RD001', bank: 'HDFC Bank', type: 'Maturity (P+I)', amount: 396075, date: '2027-09-10', recordId: 'rd-1', overdue: false },
  { id: 'ev-rd-mat-rd-6', kind: 'RD', number: 'RD006', bank: 'Punjab National Bank', type: 'Maturity (P+I)', amount: 296640, date: '2027-11-12', recordId: 'rd-6', overdue: false },
  { id: 'ev-fd-mat-fd-10', kind: 'FD', number: 'FD010', bank: 'Canara Bank', type: 'Maturity (P+I)', amount: 305598, date: '2028-01-14', recordId: 'fd-10', overdue: false },
  { id: 'ev-fd-mat-fd-11', kind: 'FD', number: 'FD011', bank: 'HDFC Bank', type: 'Maturity (P+I)', amount: 211176, date: '2028-03-05', recordId: 'fd-11', overdue: false },
  { id: 'ev-fd-mat-fd-13', kind: 'FD', number: 'FD013', bank: 'State Bank of India', type: 'Maturity (P+I)', amount: 550000, date: '2028-05-05', recordId: 'fd-13', overdue: false },
  { id: 'ev-rd-mat-rd-3', kind: 'RD', number: 'RD003', bank: 'State Bank of India', type: 'Maturity (P+I)', amount: 1060125, date: '2028-08-20', recordId: 'rd-3', overdue: false },
];

export const initialNotifications: PortfolioNotification[] = [
  { id: 'ntf-fd-4-renew', icon: 'alert', severity: 'high', title: 'FD004 matured — action needed', subtitle: 'Axis Bank · Renewal decision pending', date: '2026-07-24', recordType: 'FD', recordId: 'fd-4' },
  { id: 'ntf-fd-15-overdue', icon: 'alert', severity: 'high', title: 'FD015 interest overdue', subtitle: 'Kotak Mahindra Bank · Expected 2026-08-05', date: '2026-08-05', recordType: 'FD', recordId: 'fd-15' },
  { id: 'ntf-fd-2-mat', icon: 'clock', severity: 'medium', title: 'FD002 matures in 4 days', subtitle: 'State Bank of India · ₹12,49,716', date: '2026-08-10', recordType: 'FD', recordId: 'fd-2' },
  { id: 'ntf-fd-3-mat', icon: 'clock', severity: 'medium', title: 'FD003 matures in 6 days', subtitle: 'ICICI Bank · ₹2,11,176', date: '2026-08-10', recordType: 'FD', recordId: 'fd-3' },
  { id: 'ntf-fd-14-mat', icon: 'clock', severity: 'high', title: 'FD014 matures in 3 days', subtitle: 'Axis Bank · ₹10,08,641', date: '2026-08-10', recordType: 'FD', recordId: 'fd-14' },
  { id: 'ntf-rd-6-missed', icon: 'alert', severity: 'high', title: 'RD006 has 1 missed installment', subtitle: 'Punjab National Bank · Pay to avoid penalty', date: '2026-08-10', recordType: 'RD', recordId: 'rd-6' },
  { id: 'ntf-fd-14-autorenew', icon: 'refresh', severity: 'medium', title: 'FD014 auto-renewal pending', subtitle: 'Axis Bank · Confirm before maturity', date: '2026-08-13', recordType: 'FD', recordId: 'fd-14' },
  { id: 'ntf-fd-2-autorenew', icon: 'refresh', severity: 'medium', title: 'FD002 auto-renewal pending', subtitle: 'State Bank of India · Confirm before maturity', date: '2026-08-14', recordType: 'FD', recordId: 'fd-2' },
  { id: 'ntf-rd-5-mat', icon: 'clock', severity: 'medium', title: 'RD005 matures this month', subtitle: 'Kotak Mahindra Bank · ₹2,48,580', date: '2026-08-25', recordType: 'RD', recordId: 'rd-5' },
];

export function formatINR(n: number | null | undefined, opts: { signed?: boolean } = {}): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = Math.round(n);
  const s = Math.abs(v).toLocaleString('en-IN');
  return (opts.signed && v > 0 ? '+' : '') + (v < 0 ? '-' : '') + '₹' + s;
}

export function formatCompactINR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return (n / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (abs >= 1e5) return (n / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + ' K';
  return String(Math.round(n));
}

export function formatDate(iso: string | null | undefined, style: 'medium' | 'short' | 'monthYear' = 'medium'): string {
  if (!iso) return '—';
  const dt = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (style === 'short') return `${dt.getDate()} ${months[dt.getMonth()]}`;
  if (style === 'monthYear') return `${months[dt.getMonth()]} ${dt.getFullYear()}`;
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const FREQ_N: Record<string, number> = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 };

export interface CalcFDInput {
  principal: number;
  ratePct: number;
  startDate: string;
  years?: number;
  months?: number;
  days?: number;
  compounding?: string;
  payoutFrequency?: string;
  tdsPercent?: number;
}

export interface CalcFDResult {
  maturityDate: string;
  totalDays: number;
  totalYears: number;
  simpleInterest: number;
  compoundInterest: number;
  simpleMaturity: number;
  compoundMaturity: number;
  effectiveYield: number;
  interestPerMonth: number;
  interestPerQuarter: number;
  interestPerYear: number;
  afterTaxInterest: number;
  roi: number;
  monthlyGrowth: number;
  quarterlyGrowth: number;
  annualGrowth: number;
}

// FD calculator — independent scenario, mirrors FD Master workbook logic
export function calcFD({
  principal, ratePct, startDate, years = 0, months = 0, days = 0,
  compounding = 'Quarterly', tdsPercent = 10,
}: CalcFDInput): CalcFDResult {
  const start = new Date(startDate);
  const maturity = new Date(start);
  maturity.setFullYear(maturity.getFullYear() + Number(years || 0));
  maturity.setMonth(maturity.getMonth() + Number(months || 0));
  maturity.setDate(maturity.getDate() + Number(days || 0));
  const totalDays = daysBetween(start, maturity);
  const totalYears = totalDays / 365;
  const r = ratePct / 100;
  const simpleInterest = principal * r * totalYears;
  const n = FREQ_N[compounding] || 4;
  const compoundAmount = principal * Math.pow(1 + r / n, n * totalYears);
  const compoundInterest = compoundAmount - principal;
  const simpleMaturity = principal + simpleInterest;
  const compoundMaturity = compoundAmount;
  const effectiveYield = (Math.pow(compoundAmount / principal, 1 / Math.max(totalYears, 0.0001)) - 1) * 100;
  const interestPerMonth = compoundInterest / Math.max(totalDays / 30.44, 0.0001);
  const interestPerQuarter = interestPerMonth * 3;
  const interestPerYear = compoundInterest / Math.max(totalYears, 0.0001);
  const afterTaxInterest = compoundInterest * (1 - tdsPercent / 100);
  const roi = (compoundInterest / principal) * 100;
  return {
    maturityDate: maturity.toISOString().slice(0, 10), totalDays, totalYears,
    simpleInterest, compoundInterest, simpleMaturity, compoundMaturity,
    effectiveYield, interestPerMonth, interestPerQuarter, interestPerYear,
    afterTaxInterest, roi,
    monthlyGrowth: compoundInterest / Math.max(totalDays / 30.44, 0.0001),
    quarterlyGrowth: interestPerQuarter, annualGrowth: interestPerYear,
  };
}

export interface CalcRDInput {
  monthlyInstallment: number;
  ratePct: number;
  startDate: string;
  years?: number;
  months?: number;
}

export interface CalcRDResult {
  maturityDate: string;
  totalMonths: number;
  totalDeposited: number;
  interestEarned: number;
  maturityAmount: number;
  effectiveYield: number;
}

// RD calculator — approximate bank convention (interest on reducing balance, quarterly compounding)
export function calcRD({ monthlyInstallment, ratePct, startDate, years = 0, months = 0 }: CalcRDInput): CalcRDResult {
  const start = new Date(startDate);
  const totalMonths = Number(years || 0) * 12 + Number(months || 0);
  const maturity = new Date(start);
  maturity.setMonth(maturity.getMonth() + totalMonths);
  const totalDeposited = monthlyInstallment * totalMonths;
  const interestEarned = monthlyInstallment * (ratePct / 100) * totalMonths * (totalMonths + 1) / 24;
  const maturityAmount = totalDeposited + interestEarned;
  return {
    maturityDate: maturity.toISOString().slice(0, 10), totalMonths, totalDeposited,
    interestEarned, maturityAmount,
    effectiveYield: (interestEarned / totalDeposited) * 100 * (12 / Math.max(totalMonths, 1)),
  };
}
