"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import type { FormEvent } from "react"

import { createCoupon, setCouponActive } from "@/lib/actions/coupon.actions"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type CouponRow = {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: string
  minimumAmount: string | null
  usageLimit: number | null
  expiresAt: string | null
  isActive: boolean
} & {
  _count: { usages: number }
}

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const data = Object.fromEntries(formData.entries())
    startTransition(async () => {
      const result = await createCoupon(data)
      setMessage(result.message)
      if (result.success) {
        form.reset()
        router.refresh()
      }
    })
  }

  function toggleCoupon(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await setCouponActive(id, !isActive)
      setMessage(result.message)
      if (result.success) router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-lg border p-4 md:grid-cols-3"
        onSubmit={submit}
      >
        <Input
          name="code"
          placeholder="Coupon code"
          required
          minLength={3}
          maxLength={40}
        />
        <select
          name="discountType"
          className="bg-background h-9 rounded-md border px-3 text-sm"
          defaultValue="percentage"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount</option>
        </select>
        <Input
          name="discountValue"
          type="number"
          placeholder="Discount value"
          min="0.01"
          step="0.01"
          required
        />
        <Input
          name="minimumAmount"
          type="number"
          placeholder="Minimum cart amount (optional)"
          min="0"
          step="0.01"
        />
        <Input
          name="usageLimit"
          type="number"
          placeholder="Usage limit (optional)"
          min="1"
          step="1"
        />
        <Input
          name="startsAt"
          type="datetime-local"
          aria-label="Coupon starts at (optional)"
        />
        <Input
          name="expiresAt"
          type="datetime-local"
          aria-label="Coupon expires at (optional)"
        />
        <Button type="submit" disabled={isPending}>
          Create coupon
        </Button>
      </form>

      {message && <p role="status">{message}</p>}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Minimum</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-medium">{coupon.code}</TableCell>
                <TableCell>
                  {coupon.discountValue}
                  {coupon.discountType === "percentage" ? "%" : ""}
                </TableCell>
                <TableCell>{coupon.minimumAmount ?? "—"}</TableCell>
                <TableCell>
                  {coupon._count.usages}
                  {coupon.usageLimit === null ? "" : ` / ${coupon.usageLimit}`}
                </TableCell>
                <TableCell>{coupon.isActive ? "Active" : "Inactive"}</TableCell>
                <TableCell>
                  {coupon.expiresAt?.slice(0, 10) ?? "No expiry"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => toggleCoupon(coupon.id, coupon.isActive)}
                  >
                    {coupon.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {coupons.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground text-center"
                >
                  No coupons created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
