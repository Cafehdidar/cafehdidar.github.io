/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/studio',
  assetPrefix: '/studio',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
