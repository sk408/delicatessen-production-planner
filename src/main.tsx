import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './index.css';

// Performance monitoring
const startTime = performance.now();

// Error reporting
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/delicatessen-production-planner">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Log load time
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`Application loaded in ${loadTime.toFixed(2)}ms`);
});
