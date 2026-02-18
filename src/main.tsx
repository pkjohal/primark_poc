// Application entry point

import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode disabled to prevent double camera initialization in development
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
