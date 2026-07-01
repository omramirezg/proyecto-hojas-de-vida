import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fija la raíz del workspace (hay otros lockfiles en el sistema que confunden a Next).
  outputFileTracingRoot: projectRoot,
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  images: {
    remotePatterns: [
      // Avatares de Clerk
      { protocol: 'https', hostname: 'img.clerk.com' },
      // Logos / archivos públicos de Supabase Storage (ajusta el host a tu proyecto)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
