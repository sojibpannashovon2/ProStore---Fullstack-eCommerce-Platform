import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import { getMyCart } from "@/lib/actions/cart.actions"
import { getProductBySlug } from "@/lib/actions/product.actions"
import { isProductWishlisted } from "@/lib/actions/wishlist.actions"
import { SERVER_URL } from "@/constants"
import { getCurrentUser } from "@/lib/auth-guard"

import { Rating } from "@/components/shared/rating"
import { TranslatedText } from "@/components/shared/translated-text"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { ProductCartAction } from "./_components/product-cart-action"
import { ProductImages } from "./_components/product-images"
import { ProductPrice } from "./_components/product-price"
import { ReviewList } from "./_components/review-list"
import { WishlistButton } from "./_components/wishlist-button"

interface ProductDetailsPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { slug } = await params

  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const currentUser = await getCurrentUser()
  const userId = currentUser?.id
  const userRole = currentUser?.role
  const [cart, isWishlisted] = await Promise.all([
    getMyCart(),
    userRole === "customer" ? isProductWishlisted(product.id) : false,
  ])
  const productUrl = new URL(`/product/${product.slug}`, SERVER_URL).toString()
  const productStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images,
        brand: { "@type": "Brand", name: product.brand },
        sku: product.variants[0]?.sku,
        offers: {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: "USD",
          price: Number(product.price),
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        ...(product.numReviews > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(product.rating),
                reviewCount: product.numReviews,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SERVER_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: product.name,
            item: productUrl,
          },
        ],
      },
    ],
  }).replace(/</g, "\\u003c")

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: productStructuredData }}
      />
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Images Column */}
          <div className="col-span-2">
            <ProductImages images={product.images} />
          </div>
          {/* Details Column */}
          <div className="col-span-2 p-5">
            <div className="flex flex-col gap-6">
              <p>
                {product.brand} . <TranslatedText text={product.category} />
              </p>
              {product.seller?.store && (
                <p className="text-sm text-muted-foreground">
                  Sold by{" "}
                  <Link
                    className="underline"
                    href={`/store/${product.seller.store.slug}`}
                  >
                    {product.seller.store.name}
                  </Link>
                </p>
              )}
              <h1 className="h3-bold">
                <TranslatedText text={product.name} kind="productName" />
              </h1>
              <Rating value={Number(product.rating)} />
              <p>
                {product.numReviews}{" "}
                <TranslatedText text="reviews" />
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ProductPrice
                  value={Number(product.price)}
                  className="w-fit rounded-full bg-green-100 px-5 py-2 text-green-700"
                />
              </div>
            </div>
            <div className="mt-10">
              <p className="font-semibold">
                <TranslatedText text="Description" />
              </p>
              <p><TranslatedText text={product.description} /></p>
            </div>
          </div>
          {/* Action Column */}
          <div>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex justify-between">
                  <div><TranslatedText text="Price" /></div>
                  <div>
                    <ProductPrice value={Number(product.price)} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div><TranslatedText text="Status" /></div>
                  {product.stock > 0 ? (
                    <Badge variant="outline">
                      <TranslatedText text="In Stock" />
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <TranslatedText text="Out Of Stock" />
                    </Badge>
                  )}
                </div>
                {product.stock > 0 && (
                  <div className="flex-center">
                    <ProductCartAction
                      cart={cart}
                      item={{
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        qty: 1,
                        image: product.images![0],
                      }}
                    />
                  </div>
                )}
                <WishlistButton
                  productId={product.id}
                  enabled={userRole === "customer"}
                  initiallyWishlisted={isWishlisted}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="mt-10">
        <h2 className="h2-bold mb-5">
          <TranslatedText text="Customer Reviews" />
        </h2>
        <ReviewList
          userRole={userRole || ""}
          userId={userId || ""}
          productId={product.id}
          productSlug={product.slug}
        />
      </section>
    </>
  )
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  // read route params
  const { slug } = await params
  // fetch data
  const product = await getProductBySlug(slug)

  return {
    title: product?.name,
    description: product?.description.slice(0, 160),
    alternates: { canonical: `/product/${slug}` },
    openGraph: product
      ? {
          type: "website",
          title: product.name,
          description: product.description.slice(0, 160),
          url: `/product/${product.slug}`,
          images: product.images,
        }
      : undefined,
    twitter: product
      ? {
          card: "summary_large_image",
          title: product.name,
          description: product.description.slice(0, 160),
          images: product.images.slice(0, 1),
        }
      : undefined,
  }
}

// // Return a list of `params` to populate the [slug] dynamic segment
// export async function generateStaticParams() {
//   const products = await getAllProducts()

//   return products.map((product) => ({
//     slug: product.slug,
//   }))
// }
