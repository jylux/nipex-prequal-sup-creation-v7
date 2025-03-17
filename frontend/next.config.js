/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // This helps with routing in static deployments
  trailingSlash: true
};

module.exports = nextConfig;
