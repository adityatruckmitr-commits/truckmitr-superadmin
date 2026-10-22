import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react-teleadmin';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const updateConnectionStatus = () => {
      if (connection) {
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setIsSlow(true);
        } else {
          setIsSlow(false);
        }
      }
    };

    if (connection) {
      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  if (isOnline && !isSlow) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-300 animate-pulse bg-red-500 text-white">
      {!isOnline ? (
        <>
          <WifiOff size={16} />
          <span>No Internet Connection</span>
        </>
      ) : (
        <>
          <AlertTriangle size={16} />
          <span>Slow Network Connectivity</span>
        </>
      )}
    </div>
  );
};

export default NetworkStatus;
