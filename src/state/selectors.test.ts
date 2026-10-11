import * as s from './selectors';
import type { AppState } from './AppContext';
import { deriveFd, deriveRd, deriveEvents, deriveNotifications } from '../data/derive';
import { lightTheme, darkTheme } from '../theme/colors';
import { fd, rd, NOW } from '../../tests/support/fixtures';

const f = deriveFd(fd(), NOW);
const r = deriveRd(rd(), NOW);
function state(overrides: Partial<AppState> = {}): AppState {
  return { fdList: [f], rdList: [r], events: deriveEvents([f], [r]), notifications: deriveNotifications([f], [r], NOW), search: '', filterBank: 'All', filterType: 'All', filterStatus: 'All', sortBy: 'maturity', ...overrides } as AppState;
}
beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(NOW); });
afterEach(() => { jest.useRealTimers(); });
describe('SEL: portfolio selectors', () => {
  it.each(['test bank', 'fd001', 'jane'])('SEL-001 searches bank, number and holder: %s', search => {
    expect(s.filteredSorted([f], 'FD', state({ search }))).toEqual([f]);
  });
  it('SEL-002 supports RD search and combined filters without mutating input', () => {
    expect(s.filteredSorted([r], 'RD', state({ search: 'rd001', filterBank: 'Test Bank', filterType: 'Regular', filterStatus: 'Active' }))).toEqual([r]);
    for (const override of [{ filterBank: 'Other' }, { filterType: 'Other' }, { filterStatus: 'Closed' }, { search: 'absent' }]) expect(s.filteredSorted([f], 'FD', state(override))).toEqual([]);
    const list = [f, { ...f, id: 'fd-2', principalAmount: 200000, interestRate: 9 }];
    expect(s.filteredSorted(list, 'FD', state({ sortBy: 'amount' })).map(x => x.id)).toEqual(['fd-2', 'fd-1']);
    expect(s.filteredSorted(list, 'FD', state({ sortBy: 'rate' }))[0].id).toBe('fd-2');
    expect(list[0].id).toBe('fd-1');
  });
  it('SEL-003 prioritizes active maturities over closed records', () => {
    expect(s.filteredSorted([{ ...f, id: 'closed', status: 'Closed', maturityDate: '2025-01-01' }, f], 'FD', state())[0].id).toBe('fd-1');
  });
  it('SEL-004 aggregates invested amount, active counts and distributions', () => {
    expect(s.homeMetrics(state())).toMatchObject({ totalInvestedFmt: '1.30 L', activeCount: 2, maturedCount: 0 });
    expect(s.bankDistribution(state())).toEqual([{ bank: 'Test Bank', amountFmt: '1.30 L', pct: 100 }]);
    expect(s.typeDistribution(state(), lightTheme).entries[0]).toMatchObject({ type: 'Regular', pctLabel: '100%', fraction: 1 });
    expect(s.homeMetrics(state({ fdList: [], rdList: [], events: [] })).activeCount).toBe(0);
    expect(s.typeDistribution(state({ fdList: [], rdList: [] }), lightTheme).entries).toEqual([]);
  });
  it('SEL-005 groups payout date boundaries with overdue precedence', () => {
    const dates = ['2026-06-14', '2026-06-15', '2026-06-22', '2026-07-15', '2026-07-16'];
    const events = dates.map((date, i) => ({ id: String(i), date, overdue: i === 0, kind: 'FD' as const, recordId: 'fd-1', number: 'FD001', bank: 'Test Bank', type: 'Interest', amount: 100 }));
    const groups = s.payoutGroups(state({ events }), lightTheme);
    expect(groups.overdue.map(x => x.id)).toEqual(['0']);
    expect(groups.sections.map(g => g.items.map(x => x.id))).toEqual([['1'], ['2'], ['3'], ['4']]);
    expect(s.payoutGroups(state({ events: [{ ...events[0], overdue: false }] }), lightTheme).sections.every(g => g.items.length === 0)).toBe(true);
  });
  it('SEL-006 projects only interest over six months with a nonzero display floor', () => {
    const events = [{ ...state().events[0], type: 'Interest', date: '2026-06-20', amount: 200 }];
    expect(s.projectedInterest(state({ events }))).toEqual([{ label: 'Jun', heightPct: 100 }, ...['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map(label => ({ label, heightPct: 4 }))]);
  });
  it('SEL-007 timeline excludes closed and distant maturities and shows renewal badges', () => {
    const list = [f, { ...f, id: 'soon', daysRemaining: 10, maturityDate: '2026-06-25' }, { ...f, id: 'auto', daysRemaining: 20, maturityDate: '2026-07-05', autoRenewal: 'Yes' }, { ...f, id: 'closed', status: 'Closed' }, { ...f, id: 'far', daysRemaining: 366 }];
    const items = s.timelineMonths(state({ fdList: list, rdList: [] }), lightTheme).flatMap(m => m.items);
    expect(items.map(x => x.id)).toEqual(['soon', 'auto', 'fd-1']);
    expect(items[0].actionBadge).toBe('Renewal decision needed');
    expect(items[1].actionBadge).toBe('Auto-renews');
  });
  it.each([lightTheme, darkTheme])('SEL-008 decorations respect theme and urgency ($mode)', theme => {
    expect(s.decorateFD({ ...f, daysRemaining: 7 }, theme).statusLabel).toBe('Maturing soon');
    expect(s.decorateRD({ ...r, installmentsMissed: 1 }, theme).statusFg).toBe(theme.danger);
    expect(s.decorateRD(r, theme).progressPct).toBe(50);
    expect(s.statusColors(theme, 'Matured', null).fg).toBe(theme.danger);
    expect(s.statusColors(theme, 'Closed', null).label).toBe('Closed');
    expect(s.statusColors(theme, 'Prematurely Closed', null).label).toBe('Prematurely closed');
    expect(s.chipStyle(theme, false).fg).toBeDefined();
    expect(s.chipStyle(theme, true).fg).toBeDefined();
  });
  it('SEL-009 statements show elapsed payouts newest first', () => {
    expect(s.fdStatements(f)).toEqual([]);
    const statements = s.fdStatements(deriveFd(fd({ interestPayoutMode: 'Monthly', interestRate: 12 }), NOW));
    expect(statements).toHaveLength(5);
    expect(statements[0]).toMatchObject({ date: '2026-06-01', amount: 1000, index: 5 });
  });
  it('SEL-010 draft estimates handle payout, numeric strings and empty input', () => {
    expect(s.fdEstimate(fd({ interestType: 'Simple', interestRate: 10 })).maturityAmountFmt).toBe('₹1,10,000');
    expect(s.fdEstimate(fd({ interestPayoutMode: 'Monthly' })).maturityAmountFmt).toBe('₹1,00,000');
    expect(s.rdEstimate(rd({ interestRate: 0 })).maturityAmountFmt).toBe('₹60,000');
    expect(s.fdEstimate({}).maturityAmountFmt).toBe('₹0');
    expect(s.rdEstimate({}).maturityAmountFmt).toBe('₹0');
  });
  it('SEL-011 avatars are deterministic and notifications retain record links', () => {
    expect(s.bankAvatar('Test Bank')).toEqual(s.bankAvatar('Test Bank'));
    const notification = deriveNotifications([deriveFd(fd({ startDate: '2025-01-01' }), NOW)], [], NOW)[0];
    expect(s.decorateNotification(notification, lightTheme)).toMatchObject({ recordId: 'fd-1', iconFg: lightTheme.danger });
    expect(s.urgentNotifications(state({ notifications: Array(6).fill(notification) }), lightTheme)).toHaveLength(4);
  });
});
