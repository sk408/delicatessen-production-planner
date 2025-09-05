import { 
  Bars3Icon, 
  BellIcon, 
  Cog6ToothIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';
import { useErrors, useDataSummary } from '../../store/app-store';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const errors = useErrors();
  const dataSummary = useDataSummary();
  const unreadErrors = errors.filter(error => !error.read).length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DP</span>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Delicatessen Production Planner
              </h1>
              <p className="text-sm text-gray-500">
                Intelligent batch production planning
              </p>
            </div>
          </div>
        </div>

        {/* Center section - Data summary */}
        {dataSummary.totalRecords > 0 && (
          <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">{dataSummary.totalRecords.toLocaleString()}</span>
              <span>records</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{dataSummary.uniqueItems}</span>
              <span>items</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{dataSummary.filesUploaded}</span>
              <span>files</span>
            </div>
            {dataSummary.dateRange && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {dataSummary.dateRange.start.toLocaleDateString()} - {dataSummary.dateRange.end.toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Right section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <BellIcon className="h-6 w-6" />
            {unreadErrors > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadErrors > 9 ? '9+' : unreadErrors}
              </span>
            )}
          </button>

          {/* Help */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>

          {/* Settings */}
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <Cog6ToothIcon className="h-6 w-6" />
          </button>

          {/* User menu placeholder */}
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">U</span>
          </div>
        </div>
      </div>

      {/* Mobile data summary */}
      {dataSummary.totalRecords > 0 && (
        <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{dataSummary.totalRecords.toLocaleString()} records</span>
            <span>{dataSummary.uniqueItems} items</span>
            <span>{dataSummary.filesUploaded} files</span>
          </div>
        </div>
      )}
    </header>
  );
}


