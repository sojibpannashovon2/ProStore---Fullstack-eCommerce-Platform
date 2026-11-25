"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { SellerOrderStatus } from "@prisma/client"

import { updateSellerFulfillment } from "@/lib/actions/order.actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function FulfillmentActions({
  sellerOrderId,
  status,
}: {
  sellerOrderId: string
  status: SellerOrderStatus
}) {
  const [trackingCode, setTrackingCode] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  if (
    status === SellerOrderStatus.delivered ||
    status === SellerOrderStatus.cancelled
  ) {
    return <span className="capitalize">{status}</span>
  }
  const nextStatus =
    status === SellerOrderStatus.pending
      ? SellerOrderStatus.processing
      : status === SellerOrderStatus.processing
        ? SellerOrderStatus.shipped
        : SellerOrderStatus.delivered

  function update() {
    startTransition(async () => {
      const result = await updateSellerFulfillment(
        sellerOrderId,
        nextStatus,
        trackingCode,
      )
      setMessage(result.message)
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="min-w-40 space-y-2">
      {status === SellerOrderStatus.processing && (
        <Input
          aria-label="Shipment tracking code"
          value={trackingCode}
          onChange={(event) => setTrackingCode(event.target.value)}
          placeholder="Tracking code"
          maxLength={100}
        />
      )}
      <Button
        size="sm"
        disabled={
          isPending ||
          (nextStatus === SellerOrderStatus.shipped && !trackingCode.trim())
        }
        onClick={update}
      >
        {nextStatus === SellerOrderStatus.processing
          ? "Start processing"
          : nextStatus === SellerOrderStatus.shipped
            ? "Mark shipped"
            : "Mark delivered"}
      </Button>
      {message && <p role="status" className="text-xs">{message}</p>}
    </div>
  )
}
