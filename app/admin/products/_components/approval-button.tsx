"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { approveProduct } from "@/lib/actions/product.actions"

import { Button } from "@/components/ui/button"

export function ApprovalButton({ productId }: { productId: string }) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function approve() {
    startTransition(async () => {
      const result = await approveProduct(productId)
      setMessage(result.message)
      if (result.success) router.refresh()
    })
  }

  return (
    <div>
      <Button size="sm" disabled={isPending} onClick={approve}>
        Approve
      </Button>
      {message && <p role="status" className="text-xs">{message}</p>}
    </div>
  )
}
