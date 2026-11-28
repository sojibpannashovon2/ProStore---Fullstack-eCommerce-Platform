import type { Metadata } from "next"

import { ProductCarousel } from "@/app/(root)/product/[slug]/_components/product-carousel"
import { ProductList } from "@/app/(root)/product/[slug]/_components/product-list"

import { getHomeSections } from "@/lib/actions/product.actions"

import { DealCountdown } from "./_components/deal-countdown"
import { IconBoxes } from "./_components/icon-boxes"
import { ViewAllButton } from "./_components/view-all-button"
import { ProductSection1 } from "./_components/product-section-1"
import { ProductSection2 } from "./_components/product-section-2"
import { ProductSection3 } from "./_components/product-sections-3-to-6"
import { ProductSection4 } from "./_components/product-sections-3-to-6"
import { ProductSection5 } from "./_components/product-sections-3-to-6"
import { ProductSection6 } from "./_components/product-sections-3-to-6"
import { ProductSection7 } from "./_components/product-section-7"
import { ProductSection8 } from "./_components/product-sections-8-to-10"
import { ProductSection9 } from "./_components/product-sections-8-to-10"
import { ProductSection10 } from "./_components/product-sections-8-to-10"

export const metadata: Metadata = {
  title: "Home",
}

export default async function HomePage() {
  const sections = await getHomeSections()

  return (
    <>
      <ProductSection1 data={sections[0]} title="Featured" />
      <ProductSection2 data={sections[1]} title="Trending Now" />
      <ProductSection3 data={sections[2]} title="New Arrivals" />
      <ProductSection4 data={sections[3]} title="Best Sellers" />
      <ProductSection5 data={sections[4]} title="Deals" />
      <ProductSection6 data={sections[5]} title="Top Picks" />
      <ProductSection7 data={sections[6]} title="Just In" />
      <ProductSection8 data={sections[7]} title="The Vault" />
      <ProductSection9 data={sections[8]} title="Essentials" />
      <ProductSection10 data={sections[9]} title="Architectural" viewAllCategory="Others" />
      <ViewAllButton />
      <DealCountdown />
      <IconBoxes />
    </>
  )
}
