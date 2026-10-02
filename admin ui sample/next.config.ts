import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Turbopack options if needed
  },
  // Fix for the cross-origin warning in the terminal
  devIndicators: {
    // @ts-ignore
    appIsrStatus: false,
  },
  // Allowing the user's specific network IP for dev server resources
  // @ts-ignore - allowedDevOrigins is a valid but sometimes untyped property in some versions
  allowedDevOrigins: ['192.168.254.102', 'pleasurably-endurant-maris.ngrok-free.dev', 'localhost:3000', '10.242.107.183', '10.0.2.30'],
};

export default nextConfig;
