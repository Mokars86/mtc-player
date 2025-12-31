import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { ToastProvider } from './components/Toast';
// Actually ErrorBoundary is in App.tsx imports but App uses it.
// Let's import ToastProvider.

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);