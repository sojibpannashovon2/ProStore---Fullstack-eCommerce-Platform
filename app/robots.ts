import type { MetadataRoute } from "next"

import { SERVER_URL } from "@/constants"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/seller/",
        "/user/",
        "/cart",
        "/order/",
        "/shipping-address",
        "/payment-method",
        "/place-order",
        "/api/",
      ],
    },
    sitemap: `${SERVER_URL.replace(/\/$/, "")}/sitemap.xml`,
    host: SERVER_URL,
  }
}
