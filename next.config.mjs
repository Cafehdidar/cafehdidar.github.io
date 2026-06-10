/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: '/studio',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
