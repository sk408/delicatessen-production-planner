import { clsx } from 'clsx';
import { CheckIcon } from '@heroicons/react/24/solid';

interface Step {
  id: number;
  name: string;
  description: string;
  href?: string;
}

interface ProgressStepsProps {
  currentStep: number;
  className?: string;
}

export function ProgressSteps({ currentStep, className }: ProgressStepsProps) {
  const steps: Step[] = [
    {
      id: 0,
      name: 'Overview',
      description: 'Welcome and introduction'
    },
    {
      id: 1,
      name: 'Upload Data',
      description: 'Import CSV files with sales data'
    },
    {
      id: 2,
      name: 'Configuration',
      description: 'Set up holidays and item settings'
    },
    {
      id: 3,
      name: 'Planning',
      description: 'Select dates and items for planning'
    },
    {
      id: 4,
      name: 'Results',
      description: 'Review and export production plan'
    }
  ];

  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <li 
              key={step.name} 
              className={clsx(
                'relative',
                stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
              )}
            >
              {/* Connector line */}
              {stepIdx !== steps.length - 1 && (
                <div 
                  className="absolute inset-0 flex items-center" 
                  aria-hidden="true"
                >
                  <div 
                    className={clsx(
                      'h-0.5 w-full',
                      isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                    )} 
                  />
                </div>
              )}

              {/* Step indicator */}
              <div className="relative flex items-start group">
                <span className="h-9 flex items-center">
                  {isCompleted ? (
                    <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-primary-600 rounded-full group-hover:bg-primary-800 transition-colors">
                      <CheckIcon className="w-5 h-5 text-white" />
                    </span>
                  ) : isCurrent ? (
                    <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-primary-600 rounded-full">
                      <span className="h-2.5 w-2.5 bg-primary-600 rounded-full" />
                    </span>
                  ) : (
                    <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400 transition-colors">
                      <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300 transition-colors" />
                    </span>
                  )}
                </span>

                {/* Step content */}
                <span className="ml-4 min-w-0 flex flex-col">
                  <span 
                    className={clsx(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary-600' :
                      isCompleted ? 'text-gray-900' :
                      'text-gray-500'
                    )}
                  >
                    {step.name}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {step.description}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Compact version for mobile
export function CompactProgressSteps({ currentStep, className }: ProgressStepsProps) {
  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
