
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      { // Added for Google User Avatars
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Add allowedDevOrigins for development environment
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      allowedDevOrigins: [
        // This is the origin from the warning log
        '6000-firebase-studio-1749453651055.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
        // It's good practice to also include the standard http localhost if you ever run it locally
        // without the cloud workstation proxy.
        'http://localhost:9002', 
      ],
    },
  }),
};

export default nextConfig;
