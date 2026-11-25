import Image from "next/image"
import Link from "next/link"

import type { CartItem } from "@/types"

import { CurrencyText } from "@/components/shared/currency-text"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TranslatedText } from "@/components/shared/translated-text"

interface OrderItemCardProps {
  items: CartItem[]
  isEditable?: boolean
}

export function OrderItemCard({
  items,
  isEditable = false,
}: OrderItemCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle><TranslatedText text="Order Items" /></CardTitle>

        {isEditable && (
          <Link href="/cart">
            <Button variant="outline"><TranslatedText text="Edit" /></Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><TranslatedText text="Item" /></TableHead>
              <TableHead><TranslatedText text="Quantity" /></TableHead>
              <TableHead><TranslatedText text="Price" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.slug}>
                <TableCell>
                  <Link
                    href={`/product/${item.slug}`}
                    className="flex items-center"
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={50}
                      height={50}
                    />
                    <span className="px-2">
                      <TranslatedText text={item.name} kind="productName" />
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="px-2">{item.qty}</span>
                </TableCell>
                <TableCell className="text-right">
                  <CurrencyText value={item.price} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
