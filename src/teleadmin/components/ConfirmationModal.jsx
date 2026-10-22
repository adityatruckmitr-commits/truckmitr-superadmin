import { AlertCircle, CheckCircle, X } from 'lucide-react-teleadmin';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'success', 'info'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          gradient: 'from-red-600 to-red-700',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: <AlertCircle className="w-6 h-6" />,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600'
        };
      case 'success':
        return {
          gradient: 'from-green-600 to-green-700',
          buttonBg: 'bg-green-600 hover:bg-green-700',
          icon: <CheckCircle className="w-6 h-6" />,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600'
        };
      case 'info':
        return {
          gradient: 'from-blue-600 to-blue-700',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          icon: <AlertCircle className="w-6 h-6" />,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600'
        };
      default: // warning
        return {
          gradient: 'from-orange-600 to-orange-700',
          buttonBg: 'bg-orange-600 hover:bg-orange-700',
          icon: <AlertCircle className="w-6 h-6" />,
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r ${styles.gradient} rounded-t-2xl`}>
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg">
                {styles.icon}
              </div>
              <h2 className="text-xl font-bold">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`${styles.iconBg} p-3 rounded-full flex-shrink-0`}>
                <div className={styles.iconColor}>
                  {styles.icon}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-6 py-2.5 ${styles.buttonBg} text-white font-medium rounded-lg transition-colors shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
