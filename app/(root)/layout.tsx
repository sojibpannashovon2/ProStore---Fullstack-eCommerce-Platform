import { Footer } from "@/components/shared/footer"
import { Header } from "@/components/shared/header"
import { ShoppingAssistant } from "@/components/shared/shopping-assistant"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="wrapper flex-1">{children}</main>
      <Footer />
      <ShoppingAssistant />
    </div>
  )
}
