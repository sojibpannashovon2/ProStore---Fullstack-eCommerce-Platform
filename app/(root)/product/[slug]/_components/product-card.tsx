import Image from "next/image"
import Link from "next/link"

import type { Product } from "@/types"

import { Rating } from "@/components/shared/rating"
import { CartActionButton } from "@/components/shared/cart-action-button"
import { TranslatedText } from "@/components/shared/translated-text"

import styles from "./product-card.module.css"
import { ProductPrice } from "./product-price"

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const productHref = `/product/${product.slug}`

  return (
    <article className={styles.card}>
      <div className={styles.profilePic}>
        <Link href={productHref} className={styles.imageLink}>
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
            priority={priority}
            className={`${styles.image} product-card-image`}
          />
          <span className="sr-only">
            <TranslatedText text={product.name} kind="productName" />
          </span>
        </Link>
      </div>
      <div className={styles.bottom}>
        <div className={styles.content}>
          <span className={styles.brand}>{product.brand}</span>
          <Link href={productHref} className={styles.nameLink}>
            <h2 className={`${styles.name} product-card-title`}>
              <TranslatedText text={product.name} kind="productName" />
            </h2>
          </Link>
          <div className={styles.rating}>
            <Rating value={Number(product.rating)} />
            {product.numReviews > 0 && (
              <span className={styles.reviewCount}>({product.numReviews})</span>
            )}
          </div>
          {product.stock > 0 ? (
            <ProductPrice
              value={Number(product.price)}
              className={`${styles.price} !text-lg`}
            />
          ) : null}
        </div>
        <div className={styles.bottomBottom}>
          <span className={styles.stock}>
            {product.stock > 0 ? (
              <TranslatedText text="In Stock" />
            ) : (
              <TranslatedText text="Out Of Stock" />
            )}
          </span>
          {product.stock > 0 && (
            <CartActionButton
              item={{
                productId: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                qty: 1,
                image: product.images[0],
              }}
              actionType="add"
              size="sm"
              label="Add to cart"
              className="shrink-0"
            />
          )}
        </div>
      </div>
    </article>
  )
}
