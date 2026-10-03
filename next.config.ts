import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

const connectSrc = isDevelopment
  ? "'self' https: http://localhost:3000 http://localhost:4000 ws: wss:"
  : "'self' https:";

const scriptSrc = isDevelopment
  ? "'self' 'unsafe-inline' 'unsafe-eval' https:"
  : "'self' 'unsafe-inline' https:";

const ContentSecurityPolicy = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src ${connectSrc}; frame-ancestors 'self';`;


const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\n/g, ' '),
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.craftvault.com.au',
      },
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in the application.
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
