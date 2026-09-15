import './suppressWarnings';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/common/ErrorBoundary';
import './index.css';
import { testFirestoreConnection } from './firebase';

// Verify connection to Firestore on boot as required by skill
testFirestoreConnection().catch(console.warn);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

