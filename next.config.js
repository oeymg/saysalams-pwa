const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // enable SW only in production
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
  async rewrites() {
    return [
      {
        source: '/__clerk/:path*',
        destination: 'https://api.clerk.dev/:path*',
      },
    ];
  },
});
