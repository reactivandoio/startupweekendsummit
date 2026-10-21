import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      // upload de logo de patrocinador no painel: arquivo até 2 MB + overhead do multipart
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
