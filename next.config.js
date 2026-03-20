/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary – user-uploaded images
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google OAuth profile pictures
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Facebook profile pictures
      { protocol: 'https', hostname: 'graph.facebook.com' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
      // Generic placeholder service
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  // Enable React strict mode for better dev-time warnings
  reactStrictMode: true,

  // Required for Next Auth v5 beta
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },

  // Redirect /admin to /admin/dashboard for convenience
  async redirects() {
    return [
      { source: '/admin', destination: '/admin/dashboard', permanent: false },
    ];
  },
};

module.exports = nextConfig;
