import { LanguageToggle } from "@/components/shared/header/components/menu/components/language-toggle"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex-center relative min-h-screen w-full">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      {children}
    </div>
  )
}
