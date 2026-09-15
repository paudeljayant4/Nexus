/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@nexus/ui',
    '@nexus/types',
    '@nexus/api-client',
    '@nexus/ai',
    '@nexus/database',
    '@nexus/auth',
    '@nexus/validation',
    '@nexus/config',
    '@nexus/shared',
  ],
  experimental: {
    optimizePackageImports: ['@nexus/ui'],
  },
};

module.exports = nextConfig;