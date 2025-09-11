import Head from 'next/head';

const SITE_NAME = 'Say Salams';
const SITE_URL = 'https://www.saysalams.com';
const DEFAULT_TITLE = `${SITE_NAME} — Community, Connections, Celebration`;
const DEFAULT_DESC = 'Say Salams helps Muslims discover events, build friendships, and strengthen our Ummah — every Salam spreads peace.';
const DEFAULT_IMAGE = '/icons/longlogo.png';
const DEFAULT_KEYWORDS = 'Say Salams, Muslim events, community, Ummah, friendship, Islamic events, peace, Muslim connections';

const DEFAULT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": SITE_URL,
  "name": SITE_NAME,
  "description": DEFAULT_DESC,
  "publisher": {
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}${DEFAULT_IMAGE}`
    }
  }
};

export default function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
  twitter = {
    card: 'summary_large_image',
    site: '@saysalams',
    creator: '@saysalams',
  },
  jsonLd,
  pathname,
}) {
  // Canonical URL handling - no reliance on window for SSR
  let canonicalUrl = url || (typeof pathname === 'string' ? SITE_URL + pathname : SITE_URL);

  // Ensure canonicalUrl does not have double slashes except after protocol
  canonicalUrl = canonicalUrl.replace(/([^:]\/)\/+/g, '$1');

  // Use provided values or defaults
  const finalTitle = title?.trim() || DEFAULT_TITLE;
  const finalDescription = description?.trim() || DEFAULT_DESC;
  const finalImage = image?.trim() || DEFAULT_IMAGE;

  // Always resolve absolute image URL with SITE_URL prefix if not absolute
  const absoluteImage = finalImage.startsWith('http')
    ? finalImage
    : `${SITE_URL}${finalImage.startsWith('/') ? finalImage : `/${finalImage}`}`;

  // Use provided jsonLd or default WebSite schema
  const finalJsonLd = jsonLd || DEFAULT_JSON_LD;

  return (
    <Head>
      {/* Basic */}
      <title>{finalTitle}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={DEFAULT_KEYWORDS} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_AU" />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:alt" content={finalTitle || SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitter?.card || 'summary_large_image'} />
      {twitter?.site && <meta name="twitter:site" content={twitter.site} />}
      {twitter?.creator && <meta name="twitter:creator" content={twitter.creator} />}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={absoluteImage} />

      {/* PWA / color scheme (duplicated here for crawlers; also set globally) */}
      <meta name="theme-color" content="#9b8bbd" />
      <meta name="color-scheme" content="light" />

      {/* JSON-LD structured data */}
      {finalJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(finalJsonLd) }}
        />
      )}
    </Head>
  );
}
