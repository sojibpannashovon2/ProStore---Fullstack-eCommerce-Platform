"use client"

import Image from "next/image"
import Link from "next/link"

import Autoplay from "embla-carousel-autoplay"

import type { Product } from "@/types"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

interface ProductCarouselProps {
  data: Product[]
}

export function ProductCarousel({ data }: ProductCarouselProps) {
  return (
    <Carousel
      className="mb-12 w-full"
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 7000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ]}
    >
      <CarouselContent>
        {data.map((product: Product, index) => (
          <CarouselItem key={product.id}>
            <Link className="block" href={`/product/${product.slug}`}>
              <div className="relative mx-auto h-[320px] w-full overflow-hidden bg-white sm:h-[420px] lg:h-[520px]">
                <Image
                  src={
                    product.banner
                      ? product.banner.startsWith("/") ||
                        product.banner.startsWith("http")
                        ? product.banner
                        : `/images/${product.banner}`
                      : (product.images[0] ?? "/images/banner-1.jpg")
                  }
                  alt={product.name}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 via-transparent to-transparent">
                  <h2 className="mb-5 rounded bg-black/50 px-4 py-2 text-center text-xl font-bold text-white sm:text-2xl">
                    {product.name}
                  </h2>
                </div>
              </div>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}
