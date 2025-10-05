import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};
module.exports = {
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
