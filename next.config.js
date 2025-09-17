const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    // Next.js 13+ recommended: use remotePatterns instead of domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v5.airtableusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'dl.airtable.com',
      },
    ],
    // Allow using quality={90} on next/image (required in Next 16)
    qualities: [75, 90],
  },
});
