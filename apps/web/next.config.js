/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@soft-melanin/shared", "@soft-melanin/engine"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"]
  }
};

module.exports = nextConfig;
