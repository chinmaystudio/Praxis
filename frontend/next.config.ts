import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is an imperative Three.js / R3F app. React StrictMode's dev-only
  // double-mount disposes and rebuilds GPU resources (and churns Fast Refresh),
  // which fights the WebGL lifecycle. Off in dev; production is unaffected.
  reactStrictMode: false,
  async redirects() {
    return [
      { source: "/bgmi", destination: "/events/bgmi-elite-showdown", permanent: false },
      { source: "/researchx", destination: "/events/research-x", permanent: false },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/api/payments/:path*",
        destination: `${backendUrl}/api/payments/:path*`,
      },
      {
        source: "/api/infinity/:path*",
        destination: `${backendUrl}/api/infinity/:path*`,
      },
      {
        source: "/api/team/:path*",
        destination: `${backendUrl}/api/team/:path*`,
      },
    ];
  },
};

export default nextConfig;
