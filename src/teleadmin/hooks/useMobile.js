import { useState, useEffect, useCallback } from 'react';

/**
 * Production-level mobile detection and utilities
 */

// Device detection
export const useDeviceDetection = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    isSafari: false,
    isChrome: false,
    screenSize: 'desktop',
    orientation: 'portrait',
    hasTouch: false,
    hasNotch: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Device type detection
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      // OS detection
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isAndroid = /Android/.test(ua);
      
      // Browser detection
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isChrome = /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor);
      
      // Screen size categories
      let screenSize = 'desktop';
      if (width < 640) screenSize = 'mobile';
      else if (width < 768) screenSize = 'mobile-large';
      else if (width < 1024) screenSize = 'tablet';
      else if (width < 1280) screenSize = 'laptop';
      else screenSize = 'desktop';
      
      // Orientation
      const orientation = height > width ? 'portrait' : 'landscape';
      
      // Touch support
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Notch detection (iPhone X and newer)
      const hasNotch = isIOS && (
        width === 375 && height === 812 || // iPhone X, XS, 11 Pro
        width === 414 && height === 896 || // iPhone XR, XS Max, 11, 11 Pro Max
        width === 390 && height === 844 || // iPhone 12, 12 Pro, 13, 13 Pro
        width === 428 && height === 926 || // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
        width === 393 && height === 852    // iPhone 14 Pro
      );
      
      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        isSafari,
        isChrome,
        screenSize,
        orientation,
        hasTouch,
        hasNotch,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', detectDevice);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, []);

  return device;
};

// Viewport height fix for mobile browsers (address bar issue)
export const useViewportHeight = () => {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
};

// Touch gesture detection
export const useTouchGestures = (ref, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
  } = options;

  useEffect(() => {
    if (!ref.current) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleGesture();
    };

    const handleGesture = () => {
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }
    };

    const element = ref.current;
    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);
};

// Network status detection
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        
        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };
        
        connection.addEventListener('change', handleConnectionChange);
        
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
          connection.removeEventListener('change', handleConnectionChange);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// Keyboard visibility detection (mobile)
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      // If height decreased significantly, keyboard is likely visible
      setIsKeyboardVisible(currentHeight < initialHeight * 0.75);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isKeyboardVisible;
};

// Scroll lock for modals
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isLocked]);
};

// Haptic feedback (if supported)
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10],
        error: [20, 100, 20],
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }, []);

  return triggerHaptic;
};

// Safe area insets
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const getInset = (side) => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(`env(safe-area-inset-${side})`);
      return parseInt(value) || 0;
    };

    const updateInsets = () => {
      setInsets({
        top: getInset('top'),
        right: getInset('right'),
        bottom: getInset('bottom'),
        left: getInset('left'),
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
};

// Prevent pull-to-refresh
export const usePreventPullToRefresh = (enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    let startY = 0;

    const handleTouchStart = (e) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e) => {
      const y = e.touches[0].pageY;
      // Prevent pull-to-refresh if at top of page and pulling down
      if (window.scrollY === 0 && y > startY) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled]);
};

export default {
  useDeviceDetection,
  useViewportHeight,
  useTouchGestures,
  useNetworkStatus,
  useKeyboardVisible,
  useScrollLock,
  useHapticFeedback,
  useSafeAreaInsets,
  usePreventPullToRefresh,
};
