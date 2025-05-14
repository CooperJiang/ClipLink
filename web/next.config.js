/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*'
      }
    ]
  }
};

module.exports = nextConfig; 