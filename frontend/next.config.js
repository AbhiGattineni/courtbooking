/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Dev server configuration
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: process.env.NEXT_PUBLIC_API_URL + '/:path*',
            },
        ];
    },

    // Image configuration
    images: {
        domains: ['lh3.googleusercontent.com'], // For Google profile images
    },

    // Environment variables
    env: {
        NEXT_PUBLIC_APP_NAME: 'Box Cricket Booking',
    },
};

module.exports = nextConfig;
