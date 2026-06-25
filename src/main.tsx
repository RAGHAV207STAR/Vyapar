if (typeof (Object as any).hasOwn !== 'function') {
  (Object as any).hasOwn = function (object: any, property: PropertyKey): boolean {
    if (object === null || object === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    return Object.prototype.hasOwnProperty.call(object, property);
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress Recharts ResponsiveContainer warnings caused by Framer Motion AnimatePresence
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('of chart should be greater than 0')) {
    return;
  }
  originalConsoleWarn(...args);
};

const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('The width') && args[0].includes('of chart should be greater than 0')) {
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
