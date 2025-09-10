import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Charset first for faster parsing */}
          <meta charSet="utf-8" />
          {/* Icons and PWA links */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" href="/icons/logo.png" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#6e5084" />
          <meta name="color-scheme" content="light" />
          {/* Performance hints */}
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          {/** no custom fonts */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
