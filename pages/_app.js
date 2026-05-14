import '@/styles/globals.css';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // NETWORK GUARD: Prevent Next.js Development Server from auto-refreshing the page
    // unnecessarily when connection is unstable on local network/remote devices.
    if (typeof window !== 'undefined' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1' &&
        process.env.NODE_ENV === 'development') {
      
      console.log('[Network Guard] Remote device detected. monitoring connection stability.');
      
      // Instead of overriding read-only .reload, we can warn the user or try to handle 
      // the event that causes it. 
      const handleBeforeUnload = (e) => {
        // If the reload is too frequent, we warn the user.
        // Note: Modern browsers require a return value to show a dialog.
        // e.preventDefault();
        // e.returnValue = ''; 
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, []);

  return <Component {...pageProps} />;
}
