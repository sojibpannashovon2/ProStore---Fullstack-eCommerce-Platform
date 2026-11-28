#!/usr/bin/env npx tsx
/**
 * Import products from CSV file into Neon PostgreSQL database
 * Usage: npx tsx scripts/import-csv-products.ts
 * Requires DATABASE_URL in .env pointing to Neon PostgreSQL
 */

import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const prisma = new PrismaClient()

interface ParsedProduct {
  id: number
  name: string
  brand: string
  category: string
  subcategory: string
  price: number | null
  currency: string
  asin: string
  image_url: string
}

/**
 * Parse the attributes column format: ""brand""=>""Saucony"", ""category""=>""Clothing"", ...
 * After CSV parsing, double double-quotes become single quotes: "brand"=>"Saucony"
 */
function parseAttributes(attributes: string): Record<string, string> {
  const result: Record<string, string> = {}
  
  // The format after CSV parsing: "key"=>"value", "key2"=>"value2"
  // Match each key-value pair
  const regex = /"([^"]+)"\s*=>\s*"([^"]*)"/g
  let match
  
  while ((match = regex.exec(attributes)) !== null) {
    const [, key, value] = match
    result[key] = value
  }
  
  return result
}

/**
 * Parse scientific notation price strings to number
 */
function parsePrice(priceStr: string | undefined): number | null {
  if (!priceStr || priceStr.trim() === "") {
    return null
  }
  const num = Number(priceStr)
  return isNaN(num) ? null : num
}

/**
 * Generate a slug from product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100)
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"' && nextChar === '"') {
      // Escaped quote
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

async function main() {
  const csvPath = join(__dirname, "..", ".freeagentcoder", "attachments", "20261127-210648-products_300_with_real_images.md")
  
  console.log("Reading CSV file...")
  const csvContent = readFileSync(csvPath, "utf-8")
  const lines = csvContent.trim().split("\n")
  
  if (lines.length < 2) {
    console.error("CSV file is empty or has no data rows")
    process.exit(1)
  }
  
  const header = parseCSVLine(lines[0])
  console.log("CSV Header:", header)
  
  const products: ParsedProduct[] = []
  let skipped = 0
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    try {
      const fields = parseCSVLine(line)
      if (fields.length < 4) {
        console.warn(`Skipping line ${i + 1}: insufficient fields (${fields.length})`)
        skipped++
        continue
      }
      
      const [idStr, name, attributes, image_url] = fields
      const id = parseInt(idStr, 10)
      
      if (isNaN(id)) {
        console.warn(`Skipping line ${i + 1}: invalid id ${idStr}`)
        skipped++
        continue
      }
      
      const attrs = parseAttributes(attributes)
      
      const product: ParsedProduct = {
        id,
        name: name.replace(/^"|"$/g, ""), // Remove surrounding quotes if present
        brand: attrs.brand || "Unknown",
        category: attrs.category || "Uncategorized",
        subcategory: attrs.subcategory || "General",
        price: parsePrice(attrs.price),
        currency: attrs.currency || "USD",
        asin: attrs.asin || "",
        image_url: image_url.trim(),
      }
      
      products.push(product)
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, error)
      skipped++
    }
  }
  
  console.log(`Parsed ${products.length} products, skipped ${skipped}`)
  
  // Check for duplicates by ASIN
  const asinMap = new Map<string, ParsedProduct>()
  for (const p of products) {
    if (p.asin && asinMap.has(p.asin)) {
      console.warn(`Duplicate ASIN found: ${p.asin} (id: ${p.id} and ${asinMap.get(p.asin)?.id})`)
    }
    if (p.asin) asinMap.set(p.asin, p)
  }
  
  // Import to database
  console.log("Connecting to database...")
  
  let imported = 0
  let errors = 0
  
  for (const product of products) {
    try {
      const slug = generateSlug(`${product.name}-${product.asin || product.id}`)
      
      await prisma.product.create({
        data: {
          name: product.name,
          slug,
          category: product.category,
          brand: product.brand,
          description: `${product.subcategory} - ${product.brand}`,
          price: product.price ?? 0,
          stock: 100, // Default stock
          images: product.image_url ? [product.image_url] : [],
          isApproved: true,
          isFeatured: false,
          isArchived: false,
          rating: 0,
          numReviews: 0,
        },
      })
      imported++
      
      if (imported % 50 === 0) {
        console.log(`Imported ${imported}/${products.length} products...`)
      }
    } catch (error: any) {
      errors++
      if (error.code === "P2002") {
        console.warn(`Duplicate entry for product ${product.id} (${product.name}): ${error.meta?.target}`)
      } else {
        console.error(`Error importing product ${product.id} (${product.name}):`, error.message)
      }
    }
  }
  
  console.log("\n=== Import Summary ===")
  console.log(`Total parsed: ${products.length}`)
  console.log(`Successfully imported: ${imported}`)
  console.log(`Errors: ${errors}`)
  console.log(`Skipped during parsing: ${skipped}`)
  
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})