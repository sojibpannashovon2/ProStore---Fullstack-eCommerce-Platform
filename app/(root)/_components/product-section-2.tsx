"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect, useState } from "react"
import type { Product } from "@/types"
import { ProductPrice } from "@/app/(root)/product/[slug]/_components/product-price"
import { TranslatedText } from "@/components/shared/translated-text"

interface ProductSection2Props {
  data: Product[]
  title: string
}

export function ProductSection2({ data, title }: ProductSection2Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)

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

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, 1 - rect.top / (rect.height + window.innerHeight)))
        setScrollPosition(progress)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="2">
      <div className="wrapper">
        <h2 className="h2-bold mb-10" style={{
          transform: `translateX(${scrollPosition * -50}px)`,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        }}>
          {title}
        </h2>
        <div className="overflow-x-auto pb-4 -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-6 min-w-max" style={{
            transform: `translateX(${scrollPosition * -100}px)`,
            transition: 'transform 0.1s linear'
          }}>
            {data.map((product, index) => (
              <ProductCard2 key={product.slug} product={product} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProductCard2({ product, index, isVisible }: { product: Product; index: number; isVisible: boolean }) {
  const delay = index * 60
  const style = {
    transitionDelay: `${isVisible ? delay : 0}ms`,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
  } as React.CSSProperties

  return (
    <article className="flex-shrink-0 w-64 sm:w-72 group" style={style}>
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-3">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="180px"
            className="object-cover transition-all duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium px-4 py-2 rounded-full bg-primary/90 backdrop-blur text-sm translate-y-2 group-hover:translate-y-0 transition-transform">
              View Details
            </span>
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{product.brand}</p>
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
          <ProductPrice value={Number(product.price)} className="text-base font-semibold justify-center" />
        </div>
      </Link>
    </article>
  )
}