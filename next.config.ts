import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "covers.openlibrary.org" }, { protocol: "https", hostname: "5ZWr5wm8znO5f7Ec.public.blob.vercel-storage.com" }] },
};

export default nextConfig;
