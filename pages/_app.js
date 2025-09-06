import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || "";

  return (
    <ClerkProvider publishableKey={publishableKey} {...pageProps}>
      <>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
      </>
    </ClerkProvider>
  );
}

export default MyApp;
