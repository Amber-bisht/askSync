/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  // Turbopack is now the default in Next.js 16, but we can configure it
  experimental: {
    // Enable Turbopack file system caching for faster rebuilds
    turbo: {
      // Turbopack configuration (optional, defaults are good)
    },
  },
  
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['jsonwebtoken'],
  outputFileTracingRoot: __dirname,
}

module.exports = nextConfig
