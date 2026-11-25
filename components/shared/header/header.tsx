import Image from "next/image"
import Link from "next/link"

import { getAllCategories } from "@/lib/actions/product.actions"

import { APP_NAME } from "@/constants"

import { CategoryDrawer, Menu, Search } from "./components"

export async function Header() {
  const categories = await getAllCategories()
  return (
    <header className="w-full border-b">
      <div className="wrapper flex flex-wrap items-center justify-between gap-3">
        <div className="flex-start">
          <CategoryDrawer categories={categories} />
          <Link href="/" className="flex-start ml-4">
            <Image
              src="/images/kinora-logo.png"
              alt={`${APP_NAME} logo`}
              height={150}
              width={450}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <Search categories={categories} />
        </div>
        <Menu />
        <div className="w-full lg:hidden">
          <Search categories={categories} />
        </div>
      </div>
    </header>
  )
}
