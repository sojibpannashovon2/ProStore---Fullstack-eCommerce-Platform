import { cookies } from "next/headers"
import Image from "next/image"

export default async function LoadingPage() {
  const locale = (await cookies()).get("locale")?.value
  const loadingText =
    locale === "en"
      ? "Preparing your Kinora experience..."
      : "আপনার কিনোরা অভিজ্ঞতা প্রস্তুত হচ্ছে..."

  return (
    <main
      aria-busy="true"
      className="bg-background fixed inset-0 z-[100] grid min-h-screen place-items-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute size-72 rounded-full bg-amber-500/10 blur-3xl motion-safe:animate-pulse"
      />
      <div className="bg-card/80 relative flex flex-col items-center gap-6 rounded-3xl border border-amber-500/20 px-12 py-10 shadow-2xl backdrop-blur-xl">
        <div className="relative grid size-36 place-items-center">
          <div
            aria-hidden="true"
            className="absolute inset-1 rounded-full border border-amber-500/20"
          />
          <div
            aria-hidden="true"
            className="absolute inset-1 rounded-full border-2 border-amber-500/20 border-t-amber-500 border-r-amber-300 motion-safe:animate-spin motion-reduce:animate-none"
          />
          <Image
            src="/images/kinora-logo.png"
            alt="Kinora"
            width={450}
            height={150}
            priority
            unoptimized
            className="h-auto w-24"
          />
        </div>
        <p role="status" className="text-muted-foreground text-sm">
          {loadingText}
        </p>
        <div
          aria-hidden="true"
          className="h-1 w-40 overflow-hidden rounded-full bg-amber-500/15"
        >
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-200 motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  )
}
