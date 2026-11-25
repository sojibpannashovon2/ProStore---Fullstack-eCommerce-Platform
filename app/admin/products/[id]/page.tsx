import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getProductById } from "@/lib/actions/product.actions"
import { requireAdmin } from "@/lib/auth-guard"

import { ProductForm } from "../_components/product-form"
import { TranslatedText } from "@/components/shared/translated-text"

export const metadata: Metadata = {
  title: "Update Product",
}

interface AdminProductUpdatePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminProductUpdatePage(
  props: AdminProductUpdatePageProps,
) {
  await requireAdmin()

  const { id } = await props.params

  const product = await getProductById(id)

  if (!product) return notFound()

  return (
    <>
      <h1 className="h2-bold"><TranslatedText text="Update Product" /></h1>
      <ProductForm
        type="Update"
        product={product}
        productId={product.id}
        imageUploadsEnabled={Boolean(process.env.UPLOADTHING_TOKEN?.trim())}
      />
    </>
  )
}
