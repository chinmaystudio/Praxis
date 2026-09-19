import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is an imperative Three.js / R3F app. React StrictMode's dev-only
  // double-mount disposes and rebuilds GPU resources (and churns Fast Refresh),
  // which fights the WebGL lifecycle. Off in dev; production is unaffected.
  reactStrictMode: false,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/events/bgmi-elite-showdown",
        destination: "/bgmi/index.html",
      },
      {
        source: "/bgmi",
        destination: "/bgmi/index.html",
      },
      {
        source: "/api/payments/:path*",
        destination: `${backendUrl}/api/payments/:path*`,
      },
    ];
  },
};

export default nextConfig;
