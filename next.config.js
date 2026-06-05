/** @type {import('next').NextConfig} */

// Security headers applied to every response. Tightens the browser security
// posture for a HIPAA-facing application.
const securityHeaders = [
  {
    // Enforce HTTPS for two years, including subdomains.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    // Disallow MIME-type sniffing.
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Disallow framing to mitigate clickjacking.
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Only allow the microphone (used for voice recording); deny the rest.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig = {
  // Produce a self-contained build (.next/standalone) for slim container images
  // and portable Node deployments. Override with NEXT_OUTPUT if needed.
  output: process.env.NEXT_OUTPUT || 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
