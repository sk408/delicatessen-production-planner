import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  HomeIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useActiveStep, useCanProceedToPlanning } from '@/store/app-store';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const activeStep = useActiveStep();
  const canProceedToPlanning = useCanProceedToPlanning();

  const navigation = [
    {
      name: 'Overview',
      href: '/',
      icon: HomeIcon,
      step: 0,
      enabled: true
    },
    {
      name: 'Upload Data',
      href: '/upload',
      icon: CloudArrowUpIcon,
      step: 1,
      enabled: true
    },
    {
      name: 'Configuration',
      href: '/configure',
      icon: Cog6ToothIcon,
      step: 2,
      enabled: true
    },
    {
      name: 'Planning',
      href: '/planning',
      icon: CalendarDaysIcon,
      step: 3,
      enabled: canProceedToPlanning
    },
    {
      name: 'Results',
      href: '/results',
      icon: DocumentChartBarIcon,
      step: 4,
      enabled: canProceedToPlanning
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:inset-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DP</span>
              </div>
            </div>
            <span className="text-lg font-semibold text-gray-900">Menu</span>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = activeStep === item.step;
              const isCompleted = activeStep > item.step;
              const isAccessible = item.enabled && (item.step <= activeStep + 1);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive: isRouteActive }) =>
                    clsx(
                      'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isRouteActive || isActive
                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                        : isAccessible
                        ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-gray-400 cursor-not-allowed',
                      !isAccessible && 'pointer-events-none'
                    )
                  }
                  onClick={onClose}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-primary-500'
                        : isAccessible
                        ? 'text-gray-400 group-hover:text-gray-500'
                        : 'text-gray-300'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Step indicator */}
                  <div className="flex items-center ml-2">
                    {isCompleted ? (
                      <div className="h-5 w-5 bg-success-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : isActive ? (
                      <div className="h-5 w-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">{item.step + 1}</span>
                      </div>
                    ) : (
                      <div className={clsx(
                        'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                        isAccessible 
                          ? 'border-gray-300 text-gray-400' 
                          : 'border-gray-200 text-gray-300'
                      )}>
                        <span className="text-xs font-medium">{item.step + 1}</span>
                      </div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Progress summary */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">
            Progress: {activeStep + 1} of {navigation.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((activeStep + 1) / navigation.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
