import Image from "next/image"
import Link from "next/link"

import type { Product } from "@/types"

import { Rating } from "@/components/shared/rating"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { ProductPrice } from "./product-price"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="product-card-3d w-full max-w-sm">
      <CardHeader className="items-center p-0">
        <Link href={`/product/${product.slug}`}>
          <Image
            className="product-card-image"
            src={product.images[0]}
            alt={product.name}
            height={300}
            width={300}
          />
        </Link>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="text-xs">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h2 className="product-card-title text-sm font-medium">
            {product.name}
          </h2>
        </Link>
        <div className="flex-between gap-4">
          <Rating
            value={Number(product.rating)}
            caption={
              product.numReviews > 0
                ? `${Number(product.rating).toFixed(1)} (${product.numReviews})`
                : "No reviews"
            }
          />
          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} />
          ) : (
            <p className="text-destructive">Out Of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
