"use client"

import { useRef, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types"
import { ProductPrice } from "@/app/(root)/product/[slug]/_components/product-price"
import { TranslatedText } from "@/components/shared/translated-text"
import { ViewAllButton } from "./view-all-button"

interface ProductSectionProps {
  data: Product[]
  title: string
  viewAllCategory?: string
}

export function ProductSection8({ data, title }: ProductSectionProps) {
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
    <section ref={containerRef} className="my-20" data-section="8">
      <div className="wrapper">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">The Vault</span>
            <h2 className="h2-bold">{title}</h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">
            <TranslatedText text="View All Products" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {data.map((product, index) => (
            <article
              key={product.slug}
              className="group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(16px)",
                transition: `all 0.45s ease-out ${index * 40}ms`
              }}
            >
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-full bg-muted border mb-3">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-primary/50 transition-colors" />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">{product.brand}</p>
                <h3 className="text-center font-medium text-xs line-clamp-1 mt-0.5">{product.name}</h3>
                <ProductPrice value={Number(product.price)} className="text-xs font-semibold text-center mt-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductSection9({ data, title }: ProductSectionProps) {
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
    <section ref={containerRef} className="my-20" data-section="9">
      <div className="wrapper">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Architectural</span>
            <h2 className="h2-bold">{title}</h2>
          </div>
          <span className="text-4xl font-light text-muted-foreground">09</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {data.map((product, index) => (
            <article
              key={product.slug}
              className="group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateX(0)" : "translateX(30px)",
                transition: `all 0.5s ease-out ${index * 45}ms`
              }}
            >
              <Link href={`/product/${product.slug}`} className="block">
                <div className="mb-3 overflow-hidden rounded-lg aspect-[4/3] bg-muted">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                <ProductPrice value={Number(product.price)} className="text-sm font-semibold" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProductSection10({ data, title, viewAllCategory }: ProductSectionProps) {
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
    <section ref={containerRef} className="my-20" data-section="10">
      <div className="wrapper">
        <div className="rounded-3xl border-2 border-dashed bg-muted/30 p-8 sm:p-12">
          <div className="text-center mb-8">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Coming Soon</span>
            <h2 className="text-2xl sm:text-4xl font-bold mt-2">{title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {data.map((product, index) => (
              <article
                key={product.slug}
                className="group"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateY(0) rotate(0)" : "translateY(16px) rotate(1deg)",
                  transition: `all 0.5s ease-out ${index * 40}ms`
                }}
              >
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-background border mb-2">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(min-width: 768px) 20vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <ProductPrice value={Number(product.price)} className="text-sm font-semibold" />
                </Link>
              </article>
            ))}
          </div>
          <ViewAllButton category={viewAllCategory} />
        </div>
      </div>
    </section>
  )
}