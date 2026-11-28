"use client"

import Link from "next/link"
import Image from "next/image"
import { useRef, useEffect, useState } from "react"
import type { Product } from "@/types"
import { ProductPrice } from "@/app/(root)/product/[slug]/_components/product-price"

interface ProductSectionProps {
  data: Product[]
  title: string
}

// Section 3: Film Strip Layout (horizontal scroll cards with numbered index badge)
export function ProductSection3({ data, title }: ProductSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="3">
      <div className="wrapper">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Curated Drop</span>
            <h2 className="h2-bold">{title}</h2>
          </div>
          <div className="text-sm font-mono text-muted-foreground">01 — 10</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {data.map((product, index) => (
            <article
              key={product.slug}
              className="group relative rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s ease-out ${index * 60}ms`
              }}
            >
              <span className="absolute top-2 left-2 z-10 text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/80 backdrop-blur border text-muted-foreground">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-3">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{product.brand}</p>
                  <h3 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <ProductPrice value={Number(product.price)} className="text-sm font-bold" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section 4: Spotlight / Featured Grid (Hero 1 large card + 9 compact cards)
export function ProductSection4({ data, title }: ProductSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hero = data[0]
  const rest = data.slice(1, 10)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="4">
      <div className="wrapper">
        <h2 className="h2-bold mb-8">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {hero && (
            <article
              className="md:col-span-2 md:row-span-2 group relative overflow-hidden rounded-2xl border bg-card p-6 flex flex-col justify-between"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.6s ease-out'
              }}
            >
              <span className="inline-block text-xs font-mono uppercase text-primary mb-2">Spotlight Pick</span>
              <div className="relative w-full aspect-square my-4 overflow-hidden rounded-xl bg-muted">
                <Image
                  src={hero.images[0]}
                  alt={hero.name}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{hero.brand}</p>
                <h3 className="text-xl font-bold line-clamp-2">{hero.name}</h3>
                <ProductPrice value={Number(hero.price)} className="text-2xl font-bold" />
                <Link
                  href={`/product/${hero.slug}`}
                  className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Shop Now
                </Link>
              </div>
            </article>
          )}

          {rest.map((product, index) => (
            <article
              key={product.slug}
              className="group rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-md"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.4s ease-out ${(index + 1) * 50}ms`
              }}
            >
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-muted mb-2">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 15vw, (min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">{product.brand}</p>
                <h4 className="text-xs font-medium line-clamp-1 group-hover:text-primary transition-colors">{product.name}</h4>
                <ProductPrice value={Number(product.price)} className="text-xs font-bold mt-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section 5: Glassmorphism / Dark Contrast Shelf
export function ProductSection5({ data, title }: ProductSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="5">
      <div className="wrapper">
        <div className="rounded-3xl bg-neutral-950 text-white p-6 sm:p-10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary">Exclusive Midnight Edition</span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mt-1">{title}</h2>
            </div>
            <p className="text-sm text-neutral-400">High-performance styles</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
            {data.map((product, index) => (
              <article
                key={product.slug}
                className="group rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `all 0.5s ease-out ${index * 50}ms`
                }}
              >
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-900 mb-3">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 45vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider">{product.brand}</p>
                  <h3 className="font-medium text-xs sm:text-sm line-clamp-1 text-white group-hover:text-primary transition-colors">{product.name}</h3>
                  <ProductPrice value={Number(product.price)} className="text-sm font-bold text-white mt-1" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Section 6: Minimalist Clean Columns (3D Tilt effect feel + fine borders)
export function ProductSection6({ data, title }: ProductSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect() }
    }, { threshold: 0.1 })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={containerRef} className="my-20" data-section="6">
      <div className="wrapper">
        <div className="border-t pt-8 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="h2-bold">{title}</h2>
            <span className="text-xs font-mono text-muted-foreground uppercase">Edition № 06</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {data.map((product, index) => (
            <article
              key={product.slug}
              className="group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.4s ease-out ${index * 40}ms`
              }}
            >
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted mb-2 border transition-colors group-hover:border-foreground/40">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 20vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-mono text-muted-foreground uppercase">{product.brand}</p>
                  <h3 className="font-medium text-xs line-clamp-1">{product.name}</h3>
                  <ProductPrice value={Number(product.price)} className="text-xs font-semibold" />
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}