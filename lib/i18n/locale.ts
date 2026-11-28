import { cookies } from "next/headers"

import type { Locale } from "./translations"

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  return cookieStore.get("locale")?.value === "en" ? "en" : "bn"
}