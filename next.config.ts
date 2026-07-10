import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "aysesule2405.github.io",
        pathname: "/ayse-sule-ekiz-portfolio/**",
      },
    ],
  },
};

export default nextConfig;
