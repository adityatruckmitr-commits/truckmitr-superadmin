import { useState, useEffect } from 'react';

// Hook to detect mobile device
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Mobile-optimized card wrapper
export const MobileCard = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white rounded-xl md:rounded-2xl shadow-md md:shadow-lg p-4 md:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Mobile-optimized button
export const MobileButton = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all touch-manipulation active:scale-95';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Mobile-optimized modal
export const MobileModal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 md:p-4">
        <div 
          className={`relative bg-white rounded-xl md:rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {title && (
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-xl md:rounded-t-2xl">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content */}
          <div className="px-4 md:px-6 py-4 md:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized table wrapper
export const MobileTable = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-xs md:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized grid
export const MobileGrid = ({ children, cols = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = 4, className = '' }) => {
  const gridClasses = `grid gap-${gap} 
    grid-cols-${cols.xs} 
    sm:grid-cols-${cols.sm} 
    md:grid-cols-${cols.md} 
    lg:grid-cols-${cols.lg}
    ${className}`;
  
  return <div className={gridClasses}>{children}</div>;
};

// Mobile-optimized input
export const MobileInput = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-3 md:px-4 py-2.5 md:py-3 text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Mobile-optimized select
export const MobileSelect = ({ label, options = [], error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5 md:mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-3 md:px-4 py-2.5 md:py-3 text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Mobile-optimized stat card
export const MobileStatCard = ({ icon: Icon, label, value, trend, color = 'indigo', onClick }) => {
  const colorClasses = {
    indigo: 'from-indigo-500 to-indigo-700',
    green: 'from-green-500 to-green-700',
    blue: 'from-blue-500 to-blue-700',
    red: 'from-red-500 to-red-700',
    purple: 'from-purple-500 to-purple-700',
    orange: 'from-orange-500 to-orange-700',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 text-white ${onClick ? 'cursor-pointer hover:shadow-xl active:scale-95' : ''} transition-all touch-manipulation`}
    >
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="bg-white/20 backdrop-blur-xs rounded-lg md:rounded-xl p-2 md:p-3">
          <Icon className="w-5 h-5 md:w-7 md:h-7" />
        </div>
        {trend && (
          <span className="text-xs md:text-sm font-bold bg-white/20 backdrop-blur-xs rounded-full px-2 md:px-3 py-1">
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs md:text-sm font-semibold opacity-90 mb-1 md:mb-2">{label}</p>
      <p className="text-2xl md:text-4xl font-bold">{value}</p>
    </div>
  );
};

// Mobile-optimized tabs
export const MobileTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
      <div className="flex gap-2 md:gap-3 min-w-max md:min-w-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-medium transition-all touch-manipulation whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-sm md:text-base">{tab.label}</span>
            {tab.badge && (
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default {
  useIsMobile,
  MobileCard,
  MobileButton,
  MobileModal,
  MobileTable,
  MobileGrid,
  MobileInput,
  MobileSelect,
  MobileStatCard,
  MobileTabs,
};
