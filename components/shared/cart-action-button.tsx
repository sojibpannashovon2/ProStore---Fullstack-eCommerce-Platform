"use client"

import { useTransition } from "react"

import { Loader2Icon, MinusIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import type { CartItem } from "@/types"

import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.actions"

import { Button, type ButtonProps } from "@/components/ui/button"
import { translate, translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

interface CartActionButtonProps extends ButtonProps {
  item: CartItem
  actionType: "add" | "remove"
  label?: string
  onSuccess?: (message: string) => void
}

export function CartActionButton({
  item,
  actionType,
  type = "button",
  size = "icon",
  variant = "outline",
  label,
  onSuccess,
  ...props
}: CartActionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { locale } = useLocale()

  const handleClick = () => {
    startTransition(async () => {
      const res =
        actionType === "add"
          ? await addItemToCart(item)
          : await removeItemFromCart(item.productId)

      if (!res.success) {
        toast.error(translateMessage(locale, res.message))
      } else {
        if (onSuccess) {
          onSuccess(res.message)
        } else {
          toast.success(translateMessage(locale, res.message))
        }
      }
    })
  }

  return (
    <Button
      disabled={isPending}
      variant={variant}
      type={type}
      size={size}
      onClick={handleClick}
      aria-label={translate(
        locale,
        label ?? (actionType === "add" ? "Add to cart" : "Remove from cart"),
      )}
      {...props}
    >
      {isPending ? (
        <Loader2Icon className="h-4 w-4 animate-spin" />
      ) : actionType === "add" ? (
        <PlusIcon className="h-4 w-4" />
      ) : (
        <MinusIcon className="h-4 w-4" />
      )}
      {label && translate(locale, label)}
    </Button>
  )
}
