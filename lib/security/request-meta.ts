import { headers } from "next/headers"

export interface RequestMeta {
  ip: string
  location: string
  device: string
  browser: string
  userAgent: string
}

function pickBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge"
  if (/chrome\//i.test(ua)) return "Chrome"
  if (/firefox\//i.test(ua)) return "Firefox"
  if (/safari\//i.test(ua)) return "Safari"
  return "Unknown"
}

function pickDevice(ua: string): string {
  if (/mobile/i.test(ua)) return "Mobile"
  if (/tablet|ipad/i.test(ua)) return "Tablet"
  return "Desktop"
}

export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers()
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  const country = h.get("x-vercel-ip-country")
  const city = h.get("x-vercel-ip-city")
  const region = h.get("x-vercel-ip-country-region")
  const location = country
    ? [city, region, country].filter(Boolean).join(", ")
    : "Unknown"
  const userAgent = h.get("user-agent") || ""

  return {
    ip,
    location: location || "Unknown",
    device: pickDevice(userAgent),
    browser: pickBrowser(userAgent),
    userAgent,
  }
}