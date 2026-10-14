import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress non-fatal SheetJS cfb zip streaming warnings (where local header size is 0 and Central Directory has the real size)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const firstArg = typeof args[0] === 'string' ? args[0] : '';
  if (
    firstArg.includes('Bad uncompressed size') ||
    firstArg.includes('Bad compressed size') ||
    firstArg.includes('Bad CRC32 checksum')
  ) {
    console.warn('[Handled SheetJS ZIP Warning]:', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);
