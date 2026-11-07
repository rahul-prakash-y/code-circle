import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UX_COPY } from '@/constants/copy';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
  saveData?: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const getEffectiveType = () => {
    const conn = (navigator as any)?.connection;
    return conn?.effectiveType || '4g';
  };

  const getSaveData = () => {
    const conn = (navigator as any)?.connection;
    return Boolean(conn?.saveData);
  };

  const [effectiveType, setEffectiveType] = useState<string>(getEffectiveType);
  const [saveData, setSaveData] = useState<boolean>(getSaveData);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      toast.success(UX_COPY.offline.syncedNotice, { id: 'network-status-online', duration: 4000 });
      // Dispatch sync event for pending offline queue
      window.dispatchEvent(new CustomEvent('app:network-reconnected'));
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast.error('Network connection lost. Offline mode activated.', {
      id: 'network-status-offline',
      duration: 4000,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any)?.connection;
    const handleConnChange = () => {
      setEffectiveType(getEffectiveType());
      setSaveData(getSaveData());
    };

    if (conn) {
      conn.addEventListener('change', handleConnChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', handleConnChange);
      }
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline, effectiveType, saveData };
};

export default useNetworkStatus;
