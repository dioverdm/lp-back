import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Test database connection on app start
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        console.log('✅ API Health Check:', data);
      })
      .catch(err => {
        console.error('❌ API Health Check failed:', err);
      });
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
