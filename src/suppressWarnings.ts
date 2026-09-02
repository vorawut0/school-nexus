/**
 * Global Console & Warning Cleaner
 * Cleans up internal environment noise (Vite HMR disconnects, Firebase WebChannel stream retries, etc.)
 */
import { setLogLevel } from 'firebase/firestore';

// 1. Silent Firestore internal log level
try {
  setLogLevel('silent');
} catch {
  // ignore
}

// 2. Filter console.warn and console.error
if (typeof window !== 'undefined') {
  const origWarn = console.warn;
  const origError = console.error;

  const shouldSuppress = (msg: string): boolean => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return (
      lower.includes('webchannelconnection') ||
      lower.includes('@firebase/firestore') ||
      lower.includes("rpc 'listen'") ||
      lower.includes('transport errored') ||
      lower.includes('firestore error handled') ||
      lower.includes('firestore offline notice') ||
      lower.includes('[vite] server connection lost') ||
      lower.includes('polling for restart') ||
      lower.includes('websocket connection to') ||
      lower.includes('failed to fetch dynamically imported module') ||
      lower.includes('unhandled promise rejection: error: no_token')
    );
  };

  console.warn = function (...args: any[]) {
    try {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (shouldSuppress(msg)) {
        return;
      }
    } catch {
      // ignore serialization errors
    }
    origWarn.apply(console, args);
  };

  console.error = function (...args: any[]) {
    try {
      const msg = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      if (shouldSuppress(msg)) {
        return;
      }
    } catch {
      // ignore serialization errors
    }
    origError.apply(console, args);
  };
}
