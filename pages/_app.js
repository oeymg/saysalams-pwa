import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import SEO from "../components/seo";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || "";

  return (
    <ClerkProvider publishableKey={publishableKey} {...pageProps}>
      <>
        {/* Default SEO (pages can override with their own <SEO/>) */}
        <SEO />
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="manifest" href="/manifest.webmanifest" />
          <meta name="theme-color" content="#F8F4EC" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="apple-touch-icon" href="/icons/logo.svg" />
        </Head>
        <Component {...pageProps} />
      </>
    </ClerkProvider>
  );
}

export default MyApp;
