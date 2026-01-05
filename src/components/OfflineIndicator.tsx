import { useOnlineStatus } from '@/utils/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

/**
 * Offline Indicator Component
 * Shows a banner when the user goes offline
 */
export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOnline) {
      // Show offline toast
      if (!toastIdRef.current) {
        toastIdRef.current = toast.error(
          'You are offline. Some features may not work.',
          {
            id: 'offline-indicator',
            duration: Infinity, // Stay until online
            icon: '📡',
          }
        );
      }
    } else {
      // Dismiss offline toast when back online
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toast.success('Connection restored!', { duration: 2000 });
        toastIdRef.current = null;
      }
    }
  }, [isOnline]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center space-x-2"
        >
          <WifiOff className="h-4 w-4" />
          <span>You are offline. Some features may not work.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

