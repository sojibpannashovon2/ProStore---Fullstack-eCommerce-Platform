import type { NextConfig } from "next"

const storageEndpoint = process.env.AWS_ENDPOINT_URL_S3
  ? new URL(process.env.AWS_ENDPOINT_URL_S3)
  : undefined
const storageBucket = process.env.AWS_BUCKET_NAME

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
      ...(storageEndpoint && storageBucket
        ? [
            {
              protocol: "https" as const,
              hostname: storageEndpoint.hostname,
              port: "",
              pathname: `/${encodeURIComponent(storageBucket)}/**`,
            },
          ]
        : []),
    ],
  },
}

export default nextConfig
