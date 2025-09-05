import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  message, 
  progress, 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        {/* Spinner */}
        <div
          className={clsx(
            'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
            sizeClasses[size]
          )}
        />
        
        {/* Progress ring if progress is provided */}
        {typeof progress === 'number' && (
          <div className="absolute inset-0">
            <svg 
              className={clsx('transform -rotate-90', sizeClasses[size])} 
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-primary-600"
                style={{
                  strokeDasharray: `${2 * Math.PI * 10}`,
                  strokeDashoffset: `${2 * Math.PI * 10 * (1 - progress / 100)}`
                }}
              />
            </svg>
            {size === 'large' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-primary-600">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {message && (
        <p className={clsx(
          'text-gray-600 text-center',
          size === 'small' ? 'text-xs mt-1' : 
          size === 'medium' ? 'text-sm mt-2' : 
          'text-base mt-3'
        )}>
          {message}
        </p>
      )}

      {typeof progress === 'number' && size !== 'large' && (
        <p className="text-xs text-gray-500 mt-1">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
}

// Inline spinner for buttons and small spaces
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div 
      className={clsx(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-current',
        className
      )} 
    />
  );
}

// Full page loading overlay
export function LoadingOverlay({ 
  message = 'Loading...', 
  progress 
}: { 
  message?: string; 
  progress?: number; 
}) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-large p-6 max-w-sm w-full mx-4">
        <LoadingSpinner size="large" message={message} progress={progress} />
      </div>
    </div>
  );
}

// Skeleton loader for content
export function SkeletonLoader({ 
  lines = 3, 
  className 
}: { 
  lines?: number; 
  className?: string; 
}) {
  return (
    <div className={clsx('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="flex space-x-4">
          <div className="rounded-full bg-gray-200 h-4 w-4"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            {index === 0 && <div className="h-4 bg-gray-200 rounded w-1/2"></div>}
          </div>
        </div>
      ))}
    </div>
  );
}


