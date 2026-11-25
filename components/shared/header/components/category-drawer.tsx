"use client"

import Link from "next/link"

import { MenuIcon } from "lucide-react"

import { TranslatedText } from "@/components/shared/translated-text"
import { buttonVariants } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function CategoryDrawer({
  categories,
}: {
  categories: Array<{ category: string; _count: { category: number } }>
}) {
  return (
    <Drawer direction="left">
      <DrawerTrigger className={buttonVariants({ variant: "outline" })}>
        <MenuIcon />
        <span className="sr-only">
          <TranslatedText text="Select a category" />
        </span>
      </DrawerTrigger>
      <DrawerContent className="h-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle>
            <TranslatedText text="Select a category" />
          </DrawerTitle>
          <DrawerDescription>
            <TranslatedText text="Browse products by category." />
          </DrawerDescription>
          <div className="mt-4 flex flex-col items-start space-y-1">
            {categories.map((x) => (
              <DrawerClose asChild key={x.category}>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href={`/search?category=${encodeURIComponent(x.category)}`}
                >
                  <TranslatedText text={x.category} /> ({x._count.category})
                </Link>
              </DrawerClose>
            ))}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}
