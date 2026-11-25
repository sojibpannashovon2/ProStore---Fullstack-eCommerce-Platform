import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"

import { ProductCard } from "@/app/(root)/product/[slug]/_components/product-card"

import { prisma } from "@/db/prisma"

import { getAllProducts } from "@/lib/actions/product.actions"

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await prisma.store.findUnique({
    where: { slug },
    select: { name: true, description: true },
  })
  return {
    title: store?.name ?? "Store",
    description: store?.description.slice(0, 160),
    alternates: { canonical: `/store/${slug}` },
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
      sellerId: true,
      name: true,
      description: true,
      logo: true,
      banner: true,
    },
  })
  if (!store) notFound()

  const products = await getAllProducts({
    page: 1,
    limit: 48,
    sellerId: store.sellerId,
  })

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      {store.banner && (
        <div className="overflow-hidden rounded-lg">
          <Image
            src={store.banner}
            alt={`${store.name} banner`}
            width={1200}
            height={300}
            className="h-48 w-full object-cover"
          />
        </div>
      )}
      <header className="space-y-2">
        <h1 className="h1-bold">{store.name}</h1>
        <p className="text-muted-foreground max-w-3xl">{store.description}</p>
      </header>
      {products.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>No approved products are available in this store yet.</p>
      )}
    </div>
  )
}
