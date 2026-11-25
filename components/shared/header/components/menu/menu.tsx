import Link from "next/link"

import { EllipsisVerticalIcon, ShoppingCartIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { ModeToggle, UserButton, LanguageToggle } from "./components"
import { TranslatedText } from "@/components/shared/translated-text"

export function Menu() {
  return (
    <div className="flex justify-end gap-3">
      {/* Desktop */}
      <nav className="hidden w-full max-w-xs gap-1 lg:flex">
        <LanguageToggle />
        <ModeToggle />
        <Button asChild variant="ghost">
          <Link href="/cart">
            <ShoppingCartIcon /> <TranslatedText text="Cart" />
          </Link>
        </Button>
        <UserButton />
      </nav>
      {/* Mobile */}
      <nav className="lg:hidden">
        <Sheet>
          <SheetTrigger className="align-middle">
            <EllipsisVerticalIcon />
            <span className="sr-only">
              <TranslatedText text="Menu" />
            </span>
          </SheetTrigger>
          <SheetContent className="flex flex-col items-start">
            <SheetHeader>
              <SheetTitle>
                <TranslatedText text="Menu" />
              </SheetTitle>
              <SheetDescription>
                <TranslatedText text="Make changes to your profile here" />
              </SheetDescription>
            </SheetHeader>
            <LanguageToggle />
            <ModeToggle />
            <Button asChild variant="ghost">
              <Link href="/cart">
                <ShoppingCartIcon /> <TranslatedText text="Cart" />
              </Link>
            </Button>
            <UserButton />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
