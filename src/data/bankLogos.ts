import axis from '../assets/banks/axis.png';
import bob from '../assets/banks/bob.png';
import canara from '../assets/banks/canara.png';
import hdfc from '../assets/banks/hdfc.png';
import icici from '../assets/banks/icici.png';
import idfcFirst from '../assets/banks/idfc-first.png';
import kotak from '../assets/banks/kotak.png';
import pnb from '../assets/banks/pnb.png';
import sbi from '../assets/banks/sbi.png';
import yes from '../assets/banks/yes.png';

// Official bank logo assets, keyed by the exact bank name strings in BANKS (see portfolioData.ts).
// `ratio` is the source PNG's width/height, used to size the logo without distorting it.
export type BankLogoEntry = {
  source: number;
  ratio: number;
};

export const BANK_LOGOS: Record<string, BankLogoEntry> = {
  'HDFC Bank': { source: hdfc, ratio: 5.9837 },
  'ICICI Bank': { source: icici, ratio: 5.0222 },
  'State Bank of India': { source: sbi, ratio: 1.0031 },
  'Axis Bank': { source: axis, ratio: 4.2091 },
  'Kotak Mahindra Bank': { source: kotak, ratio: 4.0284 },
  'Punjab National Bank': { source: pnb, ratio: 5.1258 },
  'Bank of Baroda': { source: bob, ratio: 3.1111 },
  'Yes Bank': { source: yes, ratio: 2.7902 },
  'IDFC First Bank': { source: idfcFirst, ratio: 2.8333 },
  'Canara Bank': { source: canara, ratio: 5.3244 },
};
