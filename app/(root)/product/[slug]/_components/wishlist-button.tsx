"use client"

import { useState, useTransition } from "react"

import { Heart } from "lucide-react"

import { toggleWishlistItem } from "@/lib/actions/wishlist.actions"

import { Button } from "@/components/ui/button"

export function WishlistButton({
  productId,
  enabled,
  initiallyWishlisted,
}: {
  productId: string
  enabled: boolean
  initiallyWishlisted: boolean
}) {
  const [isWishlisted, setIsWishlisted] = useState(initiallyWishlisted)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  if (!enabled) return null

  function toggle() {
    startTransition(async () => {
      try {
        const result = await toggleWishlistItem(productId)
        setIsWishlisted(result.isWishlisted)
        setMessage(result.isWishlisted ? "Added to wishlist" : "Removed from wishlist")
      } catch {
        setMessage("Sign in as a customer to manage your wishlist")
      }
    })
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={isPending}
        aria-pressed={isWishlisted}
        onClick={toggle}
      >
        <Heart className={isWishlisted ? "fill-current" : ""} />
        {isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      </Button>
      {message && <p role="status" className="text-center text-xs">{message}</p>}
    </div>
  )
}
