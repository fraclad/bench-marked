/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use basePath in production
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/app/bench-marked',
    trailingSlash: true,
    assetPrefix: '/app/bench-marked/',
  }),
};

export default nextConfig;
