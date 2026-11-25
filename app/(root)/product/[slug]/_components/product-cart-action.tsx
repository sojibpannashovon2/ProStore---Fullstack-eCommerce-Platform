"use client"

import { useRouter } from "next/navigation"

import { ArrowRightIcon } from "lucide-react"
import { toast } from "sonner"

import type { Cart, CartItem } from "@/types"

import { CartActionButton } from "@/components/shared/cart-action-button"
import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"
import { translate, translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface ProductCartActionProps {
  item: CartItem
  cart?: Cart
}

export function ProductCartAction({ item, cart }: ProductCartActionProps) {
  const router = useRouter()
  const { locale } = useLocale()

  // Check if item is already in the cart
  const existItem = cart?.items.find((x) => x.productId === item.productId)
  const buyNowButton = existItem ? (
    <Button
      type="button"
      className="w-full"
      onClick={() => router.push("/shipping-address")}
    >
      <ArrowRightIcon className="size-4" />
      <TranslatedText text="Buy Now" />
    </Button>
  ) : (
    <CartActionButton
      item={item}
      variant="outline"
      actionType="add"
      label="Buy Now"
      onSuccess={() => router.push("/shipping-address")}
      className="w-full"
    />
  )

  const handleSuccessAdd = (message: string) => {
    toast.success(translateMessage(locale, message), {
      action: {
        label: translate(locale, "Go To Cart"),
        onClick: () => router.push("/cart"),
      },
    })
  }

  if (existItem) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-3">
          <CartActionButton item={item} actionType="remove" />
          <span>{existItem.qty}</span>
          <CartActionButton
            item={item}
            actionType="add"
            onSuccess={handleSuccessAdd}
          />
        </div>
        {buyNowButton}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <CartActionButton
        item={item}
        variant="default"
        actionType="add"
        onSuccess={handleSuccessAdd}
        className="w-full"
        label="Add to cart"
      />
      {buyNowButton}
    </div>
  )
}
