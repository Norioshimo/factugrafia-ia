import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Módulos con binarios nativos usados para convertir PDF a imagen (Groq)
  serverExternalPackages: ["pdf-to-img", "pdfjs-dist", "@napi-rs/canvas"],
};

export default nextConfig;
