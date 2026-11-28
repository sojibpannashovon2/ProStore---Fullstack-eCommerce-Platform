"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect, useState } from "react"
import type { Product } from "@/types"
import { ProductPrice } from "@/app/(root)/product/[slug]/_components/product-price"
import { TranslatedText } from "@/components/shared/translated-text"
import { CartActionButton } from "@/components/shared/cart-action-button"

interface ProductSection1Props {
  data: Product[]
  title: string
}

export function ProductSection1({ data, title }: ProductSection1Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="1">
      <div className="wrapper">
        <h2 className="h2-bold mb-10 relative inline-block">
          <span className="relative z-10">{title}</span>
          <span className="absolute bottom-0 left-0 right-0 h-2 bg-coral/30 -z-10 scale-x-0 origin-left transition-transform duration-700 ease-out {isVisible ? 'scale-x-100' : ''}" />
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
          {data.map((product, index) => (
            <ProductCard1 key={product.slug} product={product} index={index} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductCard1({ product, index, isVisible }: { product: Product; index: number; isVisible: boolean }) {
  const delay = index * 80
  const style = {
    transitionDelay: `${isVisible ? delay : 0}ms`,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
  } as React.CSSProperties

  return (
    <article className="group" style={style}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{product.brand}</p>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
          <ProductPrice value={Number(product.price)} className="text-lg font-bold" />
        </div>
      </Link>
    </article>
  )
}