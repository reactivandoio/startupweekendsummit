import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Em dev, libera o site pra outros aparelhos da rede (celular, outro computador): DEV_ORIGINS=192.168.0.10,meu-mac.local
  allowedDevOrigins: process.env.DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean),
  experimental: {
    serverActions: {
      // upload de logo de patrocinador no painel: arquivo até 2 MB + overhead do multipart
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
