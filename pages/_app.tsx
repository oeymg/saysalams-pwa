import Head from 'next/head';
import '../styles.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#6D4A7D" />
        {/* iOS install tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <title>Say Salams</title>
        <meta name="description" content="Discover Muslim-friendly events near you" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}