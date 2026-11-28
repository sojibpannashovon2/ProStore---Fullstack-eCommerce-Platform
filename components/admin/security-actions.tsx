"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { blockIpAction, unblockIpAction } from "@/lib/actions/security.actions"

import { Button } from "@/components/ui/button"

export function BlockIpButton({ ip }: { ip: string }) {
  const [pending, startTransition] = useTransition()
  const onClick = () => {
    const reason = window.prompt(`Reason to block ${ip}:`, "Suspicious activity")
    if (!reason || reason.trim().length < 3) {
      toast.error("A reason of at least 3 characters is required")
      return
    }
    startTransition(async () => {
      const res = await blockIpAction(ip, reason)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }
  return (
    <Button size="sm" variant="destructive" disabled={pending} onClick={onClick}>
      Block
    </Button>
  )
}

export function UnblockIpButton({ ip }: { ip: string }) {
  const [pending, startTransition] = useTransition()
  const onClick = () => {
    startTransition(async () => {
      const res = await unblockIpAction(ip)
      if (res.success) toast.success(res.message)
      else toast.error(res.message)
    })
  }
  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={onClick}>
      Unblock
    </Button>
  )
}