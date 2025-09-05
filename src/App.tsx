import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './components/pages/HomePage';
import { DataUploadPage } from './components/pages/DataUploadPage';
import { NotificationProvider } from './components/common/NotificationProvider';

export function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router basename="/delicatessen-production-planner">
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="upload" element={<DataUploadPage />} />
              <Route path="configure" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Configuration Page</h1><p className="mt-4 text-gray-600">Coming Soon</p></div>} />
              <Route path="planning" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Planning Page</h1><p className="mt-4 text-gray-600">Coming Soon</p></div>} />
              <Route path="results" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Results Page</h1><p className="mt-4 text-gray-600">Coming Soon</p></div>} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}


