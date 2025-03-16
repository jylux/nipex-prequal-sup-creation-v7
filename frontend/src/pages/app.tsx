// frontend/src/pages/_app.tsx

import '../styles/globals.css'; // Import global styles (Tailwind or custom CSS)
import type { AppProps } from 'next/app';
import React from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;

