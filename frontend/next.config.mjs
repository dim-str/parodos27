/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['192.168.1.67'],
    async headers() {
    return [
      {
        // Επιτρέπει στα popups (όπως το Google Login) να επικοινωνούν με την εφαρμογή
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
