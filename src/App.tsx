import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { AppLayout } from '@components/layout/AppLayout';
import { HomePage } from '@components/pages/HomePage';
import { DataUploadPage } from '@components/pages/DataUploadPage';
import { ConfigurationPage } from '@components/pages/ConfigurationPage';
import { PlanningPage } from '@components/pages/PlanningPage';
import { ResultsPage } from '@components/pages/ResultsPage';
import { NotificationProvider } from '@components/common/NotificationProvider';

export function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<DataUploadPage />} />
            <Route path="/configure" element={<ConfigurationPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </AppLayout>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
