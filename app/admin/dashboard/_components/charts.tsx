"use client"

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { SalesDataType } from "@/types"
import { translate } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"
import { formatCurrency } from "@/lib/utils"

interface ChartsProps {
  data: { salesData: SalesDataType }
}

export function Charts({ data: { salesData } }: ChartsProps) {
  const { locale } = useLocale()

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={salesData}>
        <XAxis
          dataKey="month"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "currentColor" }} // ✅ Ensures Tailwind applies color
        />
        <YAxis
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            formatCurrency(Number(value), locale, "locale", 2)
          }
          tick={{ fill: "currentColor" }} // ✅ Ensures Tailwind applies color
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-muted rounded-md border p-2">
                  <p className="label">{`${label}`}</p>
                  <p className="desc">
                    {translate(locale, "Total sales")}:{" "}
                    {formatCurrency(
                      Number(payload[0].value),
                      locale,
                      "locale",
                      2,
                    )}
                  </p>
                </div>
              )
            }

            return null
          }}
        />
        <Bar
          dataKey="totalSales"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-muted-foreground shadow"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
