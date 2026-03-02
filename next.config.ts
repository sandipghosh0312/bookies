import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "covers.openlibrary.org" }, { protocol: "https", hostname: "5zwr5wm8zno5f7ec.public.blob.vercel-storage.com" }] },
};

export default nextConfig;
