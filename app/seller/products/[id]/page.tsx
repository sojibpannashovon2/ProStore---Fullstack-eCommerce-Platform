import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getSellerProductById } from "@/lib/actions/product.actions"

import { TranslatedText } from "@/components/shared/translated-text"
import { ProductForm } from "@/app/admin/products/_components/product-form"

export const metadata: Metadata = {
  title: "Update Product",
}

interface SellerProductUpdatePageProps {
  params: Promise<{ id: string }>
}

export default async function SellerProductUpdatePage({
  params,
}: SellerProductUpdatePageProps) {
  const { id } = await params
  const product = await getSellerProductById(id)
  if (!product) notFound()

  return (
    <>
      <h1 className="h2-bold">
        <TranslatedText text="Update Product" />
      </h1>
      <ProductForm
        type="Update"
        product={product}
        productId={product.id}
        returnTo="/seller/products"
        imageUploadsEnabled={true}
      />
    </>
  )
}
