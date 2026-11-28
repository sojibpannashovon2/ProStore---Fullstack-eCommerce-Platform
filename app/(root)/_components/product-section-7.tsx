"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { ProductPrice } from "@/app/(root)/product/[slug]/_components/product-price"
import { TranslatedText } from "@/components/shared/translated-text"

interface ProductSectionProps {
  data: Product[]
  title: string
}

export function ProductSection7({ data, title }: ProductSectionProps) {
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
    <section ref={containerRef} className="my-20" data-section="7">
      <div className="wrapper">
        <h2 className="h2-bold mb-8">{title}</h2>
        <div className="relative">
          {/* Wave background */}
          <div className="absolute inset-0 bg-gradient-to-r from-coral-500 via-amber-500 to-yellow-500 opacity-20" />
          <div className="relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {data.map((product, index) => (
                <article
                  key={product.slug}
                  className="group rounded-xl overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-xl"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
                    transition: `all 0.6s ease-out ${index * 50}ms`
                  }}
                >
                  <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-square bg-gradient-to-br from-coral-300 via-amber-300 to-yellow-300">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="space-y-1 p-3">
                      <p className="text-[10px] text-muted-foreground uppercase">{product.brand}</p>
                      <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                      <ProductPrice value={Number(product.price)} className="text-sm font-semibold" />
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}