/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Allow all origins for HMR and WebSocket connections in dev mode
  images: { unoptimized: true },
  allowedDevOrigins: ['192.168.117.223', 'localhost:3000'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
