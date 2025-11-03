/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  // [fix:2025-11-02] 設定 basePath 以支援子路徑部署
  // 參考: https://nextjs.org/docs/app/api-reference/next-config-js/basePath
  basePath: '/poplog',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
