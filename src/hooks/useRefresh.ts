import { useCallback, useState } from 'react';
import { useAppActions } from '../state/AppContext';

export function useRefresh() {
  const actions = useAppActions();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await actions.retryLoad();
    } finally {
      setRefreshing(false);
    }
  }, [actions]);

  return { refreshing, onRefresh };
}
