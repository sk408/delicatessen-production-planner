import { Link } from 'react-router-dom';
import { 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  CogIcon, 
  DocumentTextIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
import { useDataSummary, useAppStore } from '@/store/app-store';

export function HomePage() {
  const dataSummary = useDataSummary();
  const setActiveStep = useAppStore((state) => state.setActiveStep);

  const features = [
    {
      name: 'Multi-Year Data Analysis',
      description: 'Upload multiple CSV files to analyze sales trends across years and identify patterns.',
      icon: ChartBarIcon
    },
    {
      name: 'Intelligent Holiday Detection',
      description: 'Robust holiday awareness system that works for any year with configurable impact zones.',
      icon: CogIcon
    },
    {
      name: 'Batch Production Optimization',
      description: 'Multi-day lookahead planning with configurable batch sizes and shelf life constraints.',
      icon: DocumentTextIcon
    },
    {
      name: 'Professional Export',
      description: 'Generate XLSX files and Google Sheets with professional formatting for production floor use.',
      icon: CloudArrowUpIcon
    }
  ];

  const handleGetStarted = () => {
    setActiveStep(1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Delicatessen Production Planner
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Professional web application for intelligent batch production planning in delicatessen operations. 
          Transform your CSV sales data into optimized production plans using advanced forecasting algorithms.
        </p>
        
        {dataSummary.totalRecords === 0 ? (
          <Link
            to="/upload"
            onClick={handleGetStarted}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Get Started
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/planning"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Continue Planning
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Upload More Data
            </Link>
          </div>
        )}
      </div>

      {/* Data summary */}
      {dataSummary.totalRecords > 0 && (
        <div className="bg-white rounded-lg shadow-soft p-6 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Data Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dataSummary.totalRecords.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dataSummary.uniqueItems}
              </div>
              <div className="text-sm text-gray-500">Unique Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dataSummary.filesUploaded}
              </div>
              <div className="text-sm text-gray-500">Files Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {dataSummary.dateRange ? 
                  Math.ceil((dataSummary.dateRange.end.getTime() - dataSummary.dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <div className="text-sm text-gray-500">Days of Data</div>
            </div>
          </div>
        </div>
      )}

      {/* Features grid */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional Production Planning
            </h2>
            <p className="text-lg text-gray-600">
              Advanced features designed for modern delicatessen operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white rounded-lg shadow-soft p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <feature.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { step: 1, title: 'Upload CSV', description: 'Import your sales data files' },
            { step: 2, title: 'Configure', description: 'Set up holidays and item settings' },
            { step: 3, title: 'Select Items', description: 'Choose items and date range' },
            { step: 4, title: 'Generate Plan', description: 'Create optimized production plan' },
            { step: 5, title: 'Export', description: 'Download or share your plan' }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
