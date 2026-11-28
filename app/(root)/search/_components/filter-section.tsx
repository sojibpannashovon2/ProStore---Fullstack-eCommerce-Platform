import Link from "next/link"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { TranslatedText } from "@/components/shared/translated-text"

interface FilterSectionProps {
  title: string
  items: { name: string; value: string }[]
  currentValue: string
  paramKey: "c" | "p" | "r" | "b" | "a"
  getFilterUrl: (params: {
    c?: string
    p?: string
    r?: string
    b?: string
    a?: string
  }) => string
}

export function FilterSection({
  title,
  items,
  currentValue,
  paramKey,
  getFilterUrl,
}: FilterSectionProps) {
  return (
    <Accordion type="multiple" defaultValue={[paramKey]}>
      <AccordionItem value={paramKey}>
        <AccordionTrigger defaultValue={"open"} className="cursor-pointer">
          <TranslatedText text={title} />
        </AccordionTrigger>
        <AccordionContent>
          <ul className="max-h-64 space-y-1 overflow-y-auto pr-2">
            <li>
              <Link
                className={`hover:bg-muted text-muted-foreground block rounded p-1 transition ${
                  currentValue === "all" && "text-primary font-bold"
                }`}
                href={getFilterUrl({ [paramKey]: "all" })}
              >
                <TranslatedText text="All" />
              </Link>
            </li>
            {items.map((item) => (
              <li key={`${paramKey}-${item.value}`}>
                <Link
                  className={`hover:bg-muted text-muted-foreground block rounded p-1 transition ${
                    currentValue === item.value && "text-primary font-bold"
                  }`}
                  href={getFilterUrl({ [paramKey]: item.value })}
                >
                  <TranslatedText text={item.name} />
                </Link>
              </li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
