import type { Metadata } from "next"

import { ProductForm } from "@/app/admin/products/_components/product-form"
import { isS3StorageConfigured } from "@/lib/storage/s3"
import { TranslatedText } from "@/components/shared/translated-text"

export const metadata: Metadata = {
  title: "Create Product",
}

export default function CreateSellerProductPage() {
  return (
    <>
      <h1 className="h2-bold">
        <TranslatedText text="Create Product" />
      </h1>
      <div className="my-8">
        <ProductForm
          type="Create"
          returnTo="/seller/products"
          imageUploadsEnabled={isS3StorageConfigured()}
        />
      </div>
    </>
  )
}
