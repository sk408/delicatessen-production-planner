import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  autoClose?: number; // milliseconds
}

export function Toast({ type, message, onClose, autoClose = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);

      return () => clearTimeout(timer);
    }
  }, [autoClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };

  const styles = {
    success: {
      container: 'bg-success-50 border-success-200 text-success-800',
      icon: 'text-success-400'
    },
    error: {
      container: 'bg-error-50 border-error-200 text-error-800',
      icon: 'text-error-400'
    },
    warning: {
      container: 'bg-warning-50 border-warning-200 text-warning-800',
      icon: 'text-warning-400'
    },
    info: {
      container: 'bg-primary-50 border-primary-200 text-primary-800',
      icon: 'text-primary-400'
    }
  };

  const Icon = icons[type];
  const style = styles[type];

  return (
    <div
      className={clsx(
        'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ease-in-out',
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        'animate-slide-down'
      )}
    >
      <div className={clsx('p-4 border-l-4', style.container)}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={clsx('h-5 w-5', style.icon)} />
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">
              {message}
            </p>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={clsx(
                'inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors',
                'rounded-md p-1.5 hover:bg-gray-100'
              )}
              onClick={handleClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-close */}
      {autoClose > 0 && (
        <div className="h-1 bg-gray-200">
          <div 
            className={clsx(
              'h-full transition-all ease-linear',
              type === 'success' ? 'bg-success-500' :
              type === 'error' ? 'bg-error-500' :
              type === 'warning' ? 'bg-warning-500' :
              'bg-primary-500'
            )}
            style={{
              animation: `shrink ${autoClose}ms linear`
            }}
          />
        </div>
      )}
    </div>
  );
}

// Toast container for multiple toasts
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {children}
    </div>
  );
}

// Add CSS animation for progress bar
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);


