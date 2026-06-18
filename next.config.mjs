/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    let backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    // Ensure the URL has a protocol (Next.js requires http:// or https://)
    if (!/^https?:\/\//.test(backendUrl)) {
      backendUrl = `http://${backendUrl}`;
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
