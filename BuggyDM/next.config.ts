import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/BuggyDm",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS, POST, PUT, DELETE, PATCH" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
