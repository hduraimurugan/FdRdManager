import { navigationRef, navigate, goBack } from './navigationRef';
afterEach(() => jest.restoreAllMocks());
it('NAV-001 suppresses navigation before ready and forwards route parameters when ready', () => {
  const ready = jest.spyOn(navigationRef, 'isReady').mockReturnValue(false);
  const push = jest.spyOn(navigationRef, 'navigate').mockImplementation(() => {});
  navigate('FdDetail', { id: 'fd-1' }); expect(push).not.toHaveBeenCalled();
  ready.mockReturnValue(true); navigate('FdDetail', { id: 'fd-1' }); expect(push).toHaveBeenCalledWith('FdDetail', { id: 'fd-1' });
});
it('NAV-002 back requires readiness and a back history entry', () => {
  const ready = jest.spyOn(navigationRef, 'isReady').mockReturnValue(false);
  const canBack = jest.spyOn(navigationRef, 'canGoBack').mockReturnValue(false);
  const back = jest.spyOn(navigationRef, 'goBack').mockImplementation(() => {});
  goBack(); expect(back).not.toHaveBeenCalled(); ready.mockReturnValue(true); goBack(); expect(back).not.toHaveBeenCalled();
  canBack.mockReturnValue(true); goBack(); expect(back).toHaveBeenCalledTimes(1);
});
