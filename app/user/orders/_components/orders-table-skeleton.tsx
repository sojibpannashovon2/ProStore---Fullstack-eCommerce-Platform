import { PAGE_SIZE } from "@/constants"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TranslatedText } from "@/components/shared/translated-text"

export function OrdersTableSkeleton({ rows = PAGE_SIZE }: { rows?: number }) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><TranslatedText text="ID" /></TableHead>
            <TableHead><TranslatedText text="DATE" /></TableHead>
            <TableHead><TranslatedText text="TOTAL" /></TableHead>
            <TableHead><TranslatedText text="PAID" /></TableHead>
            <TableHead><TranslatedText text="DELIVERED" /></TableHead>
            <TableHead><TranslatedText text="ACTIONS" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mx-auto flex w-full justify-center">
        <div className="flex flex-row items-center gap-1">
          <Skeleton className="h-7 w-20" />

          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </>
  )
}
