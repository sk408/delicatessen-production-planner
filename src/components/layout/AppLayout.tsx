import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { ProgressSteps } from './ProgressSteps';
import { useActiveStep } from '@/store/app-store';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeStep = useActiveStep();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="px-6 py-4">
            <Breadcrumbs />
            
            {/* Progress indicator for multi-step workflow */}
            <div className="mb-6">
              <ProgressSteps currentStep={activeStep} />
            </div>
            
            {/* Page content */}
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
