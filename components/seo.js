import Head from 'next/head';

const SITE_NAME = 'Say Salams';
const SITE_URL = 'https://www.saysalams.com';
const DEFAULT_TITLE = `${SITE_NAME} — Community, Connections, Celebration`;
const DEFAULT_DESC = 'Say Salams helps Muslims discover events, build friendships, and strengthen our Ummah — every Salam spreads peace.';
const DEFAULT_IMAGE = '/icons/longlogo.png';

export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  image = DEFAULT_IMAGE,
  url = SITE_URL,
  type = 'website',
  noIndex = false,
  twitter = {
    card: 'summary_large_image',
    site: '@saysalams',
    creator: '@saysalams',
  },
  jsonLd = null,
}) {
  const absoluteImage = image?.startsWith('http') ? image : `${url?.startsWith('http') ? url : SITE_URL}${image?.startsWith('/') ? image : `/${image || ''}`}`;
  return (
    <Head>
      {/* Basic */}
      <title>{title}</title>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Canonical */}
      {url && <link rel="canonical" href={url} />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {absoluteImage && <meta property="og:image" content={absoluteImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitter?.card || 'summary_large_image'} />
      {twitter?.site && <meta name="twitter:site" content={twitter.site} />}
      {twitter?.creator && <meta name="twitter:creator" content={twitter.creator} />}
      {title && <meta name="twitter:title" content={title} />} 
      {description && <meta name="twitter:description" content={description} />}
      {absoluteImage && <meta name="twitter:image" content={absoluteImage} />}

      {/* PWA / color scheme (duplicated here for crawlers; also set globally) */}
      <meta name="theme-color" content="#6e5084" />
      <meta name="color-scheme" content="light" />

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </Head>
  );
}

