import { PrismaClient } from "@prisma/client"

const createPrismaClient = () =>
  new PrismaClient().$extends({
    result: {
      product: {
        price: {
          compute(product: any) {
            return product.price ? product.price.toString() : "0" // Return a default value if price is undefined or null
          },
        },
        rating: {
          compute(product: any) {
            return product.rating ? product.rating.toString() : "0"
          },
        },
      },
      cart: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart: any) {
            return cart.itemsPrice.toString()
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart: any) {
            return cart.shippingPrice.toString()
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart: any) {
            return cart.taxPrice.toString()
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart: any) {
            return cart.totalPrice.toString()
          },
        },
      },
      order: {
        itemsPrice: {
          needs: { itemsPrice: true },
          compute(cart: any) {
            return cart.itemsPrice.toString()
          },
        },
        shippingPrice: {
          needs: { shippingPrice: true },
          compute(cart: any) {
            return cart.shippingPrice.toString()
          },
        },
        taxPrice: {
          needs: { taxPrice: true },
          compute(cart: any) {
            return cart.taxPrice.toString()
          },
        },
        totalPrice: {
          needs: { totalPrice: true },
          compute(cart: any) {
            return cart.totalPrice.toString()
          },
        },
      },
      orderItem: {
        price: {
          compute(cart: any) {
            return cart.price.toString()
          },
        },
      },
    },
  })

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: ReturnType<typeof createPrismaClient>
}

// Extends the PrismaClient with a custom result transformer to convert the price and rating fields to strings.
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
