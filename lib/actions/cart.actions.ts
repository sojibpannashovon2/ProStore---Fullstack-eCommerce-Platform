"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { auth } from "@/auth"
import { z } from "zod"

import type { ActionReturn, Cart, CartItem } from "@/types"

import { prisma } from "@/db/prisma"

import { getProductById } from "@/lib/actions/product.actions"
import { calcCartPrice } from "@/lib/cart/pricing"
import { calculateCouponDiscount } from "@/lib/coupon-pricing"
import { assertRole } from "@/lib/auth-guard"
import { convertToPlainObject, formatError } from "@/lib/utils"
import { cartItemSchema, insertCartSchema } from "@/lib/validators"

export async function addItemToCart(data: CartItem): ActionReturn {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value
    if (!sessionCartId) throw new Error("Cart session not found")

    // Get session and user ID
    const session = await auth()
    const userId = session?.user?.id ? (session.user.id as string) : undefined

    // Get cart
    const cart = await getMyCart()

    // Parse and validate item
    const submittedItem = cartItemSchema.parse(data)

    // Find product in database
    const product = await getProductById(submittedItem.productId)
    if (!product) throw new Error("Product not found")
    if (!product.isApproved) throw new Error("Product is not available for sale")
    if (product.isArchived) throw new Error("Product is no longer available")
    if (!product.images[0]) throw new Error("Product image is unavailable")

    const item = cartItemSchema.parse({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      qty: submittedItem.qty,
      image: product.images[0],
      price: product.price.toString(),
    })

    if (!cart) {
      // Create new cart object
      const newCart = insertCartSchema.parse({
        userId: userId,
        items: [item],
        sessionCartId: sessionCartId,
        ...calcCartPrice([item]),
      })

      // Add to database
      await prisma.cart.create({
        data: newCart,
      })

      // Revalidate product page
      revalidatePath(`/product/${product.slug}`)

      return {
        success: true,
        message: `${product.name} added to cart`,
      }
    } else {
      // Check if item is already in cart
      const existItem = cart.items.find((x) => x.productId === item.productId)

      if (existItem) {
        // Check stock
        if (product.stock < existItem.qty + 1) {
          throw new Error("Not enough stock")
        }

        // Increase the quantity
        cart.items = cart.items.map((cartItem) =>
          cartItem.productId === item.productId
            ? { ...item, qty: existItem.qty + 1 }
            : cartItem,
        )
      } else {
        // If item does not exist in cart
        // Check stock
        if (product.stock < item.qty) throw new Error("Not enough stock")

        // Add item to the cart.items
        cart.items.push(item)
      }

      // Save to database
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items,
          couponCode: null,
          ...calcCartPrice(cart.items),
        },
      })

      revalidatePath(`/product/${product.slug}`)

      return {
        success: true,
        message: `${product.name} ${
          existItem ? "updated in" : "added to"
        } cart`,
      }
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function getMyCart(): Promise<
  (Cart & { id: string }) | undefined
> {
  // Check for cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value
  if (!sessionCartId) throw new Error("Cart session not found")

  // Get session and user ID
  const session = await auth()
  const userId = session?.user?.id ? (session.user.id as string) : undefined

  // Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  })

  if (!cart) return undefined

  // Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: z.array(cartItemSchema).parse(cart.items),
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
    discountPrice: cart.discountPrice.toString(),
    couponCode: cart.couponCode,
  })
}

export async function removeItemFromCart(productId: string): ActionReturn {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value
    if (!sessionCartId) throw new Error("Cart session not found")

    const id = z.string().uuid().parse(productId)

    // Find product in database
    const product = await getProductById(id)
    if (!product) throw new Error("Product not found")

    // Get user cart
    const cart = await getMyCart()
    if (!cart) throw new Error("Cart not found")

    // Check for item
    const exist = cart.items.find((x) => x.productId === id)
    if (!exist) throw new Error("Item not found")

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart
      cart.items = cart.items.filter((x) => x.productId !== exist.productId)
    } else {
      // Decrease qty
      cart.items.find((x) => x.productId === id)!.qty = exist.qty - 1
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items,
        couponCode: null,
        ...calcCartPrice(cart.items),
      },
    })

    revalidatePath(`/product/${product.slug}`)

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function applyCouponToCart(code: string): ActionReturn {
  try {
    const customer = await assertRole("customer")
    const normalizedCode = z
      .string()
      .trim()
      .min(3)
      .max(40)
      .transform((value) => value.toUpperCase())
      .parse(code)
    const cart = await getMyCart()
    if (!cart || cart.items.length === 0) throw new Error("Your cart is empty")

    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    })
    if (!coupon) throw new Error("Coupon not found")
    const itemsPrice = Number(cart.itemsPrice)
    const discount = calculateCouponDiscount(coupon, itemsPrice)
    const [totalUses, customerUses] = await prisma.$transaction([
      prisma.couponUsage.count({ where: { couponId: coupon.id } }),
      prisma.couponUsage.count({
        where: { couponId: coupon.id, userId: customer.id },
      }),
    ])
    if (coupon.usageLimit !== null && totalUses >= coupon.usageLimit) {
      throw new Error("This coupon has reached its usage limit")
    }
    if (customerUses > 0) {
      throw new Error("You have already used this coupon")
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponCode: coupon.code,
        ...calcCartPrice(cart.items, discount),
      },
    })
    revalidatePath("/cart")
    return { success: true, message: "Coupon applied" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

export async function removeCouponFromCart(): ActionReturn {
  try {
    const customer = await assertRole("customer")
    const cart = await getMyCart()
    if (!cart) throw new Error("Cart not found")
    if (cart.userId !== customer.id) throw new Error("Unauthorized action")

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponCode: null,
        ...calcCartPrice(cart.items),
      },
    })
    revalidatePath("/cart")
    return { success: true, message: "Coupon removed" }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}
