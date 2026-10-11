import React from 'react';
import { useRefresh } from './useRefresh';
import { render, cleanup, act } from '../../tests/support/renderer';
const mockRetry = jest.fn();
jest.mock('../state/AppContext', () => ({ useAppActions: () => ({ retryLoad: mockRetry }) }));
let refresh: ReturnType<typeof useRefresh>;
function Probe() { refresh = useRefresh(); return null; }
afterEach(cleanup);
it('REF-001 exposes loading until reload completes', async () => {
  let resolve!: () => void; mockRetry.mockReturnValue(new Promise<void>(done => { resolve = done; }));
  await render(<Probe />); let pending!: Promise<void>;
  await act(async () => { pending = refresh.onRefresh(); }); expect(refresh.refreshing).toBe(true);
  await act(async () => { resolve(); await pending; }); expect(refresh.refreshing).toBe(false);
});
it('REF-002 resets loading even if reload rejects', async () => {
  mockRetry.mockRejectedValueOnce(new Error('read failed')); await render(<Probe />);
  await act(async () => { await expect(refresh.onRefresh()).rejects.toThrow('read failed'); }); expect(refresh.refreshing).toBe(false);
});
