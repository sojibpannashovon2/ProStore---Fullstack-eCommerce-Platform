import NextAuth from "next-auth"
import { NextResponse } from "next/server"

import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)
const authMiddleware = auth(() => NextResponse.next())

export function proxy(...args: Parameters<typeof authMiddleware>) {
  const request = args[0]

  if (request.nextUrl.pathname.startsWith("/images/")) {
    const response = NextResponse.next()
    response.headers.set(
      "Cache-Control",
      "public, max-age=86400, stale-while-revalidate=604800",
    )
    return response
  }

  return authMiddleware(...args)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
