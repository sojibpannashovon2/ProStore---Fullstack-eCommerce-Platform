"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { useLocale } from "@/providers/locale-provider"
import {
  ArrowUpRight,
  Bot,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { z } from "zod"

import { translate } from "@/lib/i18n/translations"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const productSuggestionSchema = z.object({
  name: z.string(),
  slug: z.string(),
  brand: z.string(),
  category: z.string(),
  displayPrice: z.string(),
  stock: z.number(),
  availability: z.string(),
})

const assistantResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      content: z.string().optional(),
      products: z.array(productSuggestionSchema).optional(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
})

type ProductSuggestion = z.infer<typeof productSuggestionSchema>

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  products?: ProductSuggestion[]
}

const promptSuggestions = [
  "Recommend an in-stock product",
  "Compare two products",
  "Check product availability",
]

interface ShoppingAssistantPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function ShoppingAssistantPanel({
  isOpen,
  onClose,
}: ShoppingAssistantPanelProps) {
  const { locale } = useLocale()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: translate(
        locale,
        "Hi! I’m Kinora’s shopping assistant. Ask me about product details, prices, availability, or comparisons.",
      ),
    },
  ])
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [isOpen, isLoading, messages])

  const sendMessage = async (message: string) => {
    const content = message.trim()
    if (!content || isLoading) return

    const conversation: ChatMessage[] = [...messages, { role: "user", content }]
    setMessages(conversation)
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/ai-shopping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: conversation
            .slice(-10)
            .map(({ role, content: messageContent }) => ({
              role,
              content: messageContent,
            })),
        }),
      })
      const payload: unknown = await response.json().catch(() => null)
      const parsed = assistantResponseSchema.safeParse(payload)

      if (!parsed.success) {
        throw new Error(
          translate(locale, "The local AI returned an invalid response."),
        )
      }

      if (!response.ok || !parsed.data.success || !parsed.data.data?.content) {
        throw new Error(
          parsed.data.error?.message ??
            translate(
              locale,
              "The local assistant could not answer. Try again.",
            ),
        )
      }

      setMessages([
        ...conversation,
        {
          role: "assistant",
          content: parsed.data.data.content,
          products: parsed.data.data.products ?? [],
        },
      ])
    } catch (error) {
      setMessages([
        ...conversation,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : translate(
                  locale,
                  "The local assistant could not answer. Try again.",
                ),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const submitForm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage(input)
  }

  if (!isOpen) return null

  return (
    <section
      id="shopping-assistant-panel"
      role="dialog"
      aria-label={translate(locale, "Shopping assistant")}
      className="bg-card text-card-foreground flex h-[min(70vh,38rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-xl"
    >
      <header className="bg-primary text-primary-foreground flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary-foreground/15 flex size-10 items-center justify-center rounded-full">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold">
              {translate(locale, "Shopping assistant")}
            </h2>
            <p className="text-primary-foreground/75 text-xs">
              {translate(locale, "Runs with a local AI model")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={translate(locale, "Close shopping assistant")}
          className="text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
          onClick={onClose}
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
      </header>

      <div
        className="flex-1 space-y-4 overflow-y-auto p-4"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-xl px-3 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1 text-xs font-medium opacity-70">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {translate(locale, "Kinora AI")}
                </div>
              )}
              <p className="text-sm break-words whitespace-pre-wrap">
                {message.content}
              </p>
              {message.products && message.products.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.products.map((product) => (
                    <ProductSuggestionCard
                      key={product.slug}
                      product={product}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isLoading}
                onClick={() => void sendMessage(translate(locale, prompt))}
                className="border-input hover:bg-accent rounded-full border px-3 py-1.5 text-left text-xs transition-colors disabled:opacity-50"
              >
                {translate(locale, prompt)}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            {translate(locale, "Thinking...")}
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <p className="text-muted-foreground px-4 pb-2 text-xs">
        {translate(
          locale,
          "AI suggestions may be inaccurate. Confirm product details before ordering.",
        )}
      </p>
      <form onSubmit={submitForm} className="flex items-center gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={translate(locale, "Ask about products...")}
          aria-label={translate(locale, "Ask about products...")}
          maxLength={1200}
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          aria-label={translate(locale, "Send message")}
          disabled={isLoading || input.trim().length === 0}
        >
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </section>
  )
}

function ProductSuggestionCard({
  product,
  locale,
}: {
  product: ProductSuggestion
  locale: "bn" | "en"
}) {
  const formattedStock =
    product.stock > 0
      ? new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(
          product.stock,
        )
      : ""

  return (
    <Link
      href={`/product/${product.slug}`}
      className="bg-background text-foreground hover:border-primary/50 block rounded-lg border p-2.5 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold">{product.name}</span>
        <ArrowUpRight
          className="text-muted-foreground mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {product.brand} · {product.category}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
        <span className="font-semibold">{product.displayPrice}</span>
        <span>
          {product.availability}
          {formattedStock ? ` (${formattedStock})` : ""}
        </span>
      </div>
    </Link>
  )
}
