import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This is an imperative Three.js / R3F app. React StrictMode's dev-only
  // double-mount disposes and rebuilds GPU resources (and churns Fast Refresh),
  // which fights the WebGL lifecycle. Off in dev; production is unaffected.
  reactStrictMode: false,
};

export default nextConfig;
