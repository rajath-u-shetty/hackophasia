/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "https://zgnqetqkxxsiswtrgcgd.supabase.co",
      "images.unsplash.com",
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    serverActions: true,
  },
  api: {
    bodyParser: true,
  },
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, webpack }
  ) => {
    config.resolve.alias.canvas = false
    config.resolve.alias.encoding = false
    return config
  },
};

module.exports = nextConfig;

