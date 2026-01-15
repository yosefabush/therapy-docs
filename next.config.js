/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize barrel imports for icon libraries - reduces bundle size by 15-70%
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig
