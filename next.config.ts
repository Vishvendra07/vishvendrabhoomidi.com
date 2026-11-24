import type { NextConfig } from "next";
import { publicRelease } from "./src/lib/release";
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" ? {output: "export" as const, images:{unoptimized:true}} : {}),
  poweredByHeader: false,
  devIndicators: false,
  experimental: { cpus: 2 },
  turbopack: { rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } } },
  async headers() { return [{ source: "/:path*", headers: [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ...(!publicRelease ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
  ] }]; },
};
export default nextConfig;
