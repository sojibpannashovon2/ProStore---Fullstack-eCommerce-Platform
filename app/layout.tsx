import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Inter } from "next/font/google"

import "@/assets/styles/globals.css"
import { Providers } from "@/providers"

import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/constants"
import type { Locale } from "@/lib/i18n/translations"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL),
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const locale: Locale = cookieStore.get("locale")?.value === "en" ? "en" : "bn"
  const organizationData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: SERVER_URL,
    description: APP_DESCRIPTION,
    logo: `${SERVER_URL.replace(/\/$/, "")}/images/kinora-logo.png`,
  }).replace(/</g, "\\u003c")

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationData }}
        />
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  )
}
