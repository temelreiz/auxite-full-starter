/** @type {import('next').NextConfig} */
const nextConfig = {
  // Statik export
  output: 'export',

  // S3/CloudFront için
  images: { unoptimized: true },

  // S3 “directory index” için
  trailingSlash: true,

  // Build’te takılmasın
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
