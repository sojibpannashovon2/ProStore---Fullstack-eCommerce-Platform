export interface RawProduct {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  description?: string | null
  price: number | string | { toString(): string }
  stock: number
  isFeatured?: boolean
  rating?: number | string | { toString(): string }
  createdAt?: Date | string | { toString(): string }
}

export interface ProductSuggestion {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  price: number
  displayPrice: string
  stock: number
  availability: string
  isFeatured: boolean
}

export interface ShoppingAgentResult {
  content: string
  products: ProductSuggestion[]
}

export function formatPrice(priceNum: number, locale: string): string {
  if (locale === "bn") {
    const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"]
    const formattedEn = priceNum.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const bnStr = formattedEn.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)])
    return `৳${bnStr}`
  }
  return `$${priceNum.toFixed(2)}`
}

function toNumber(value: RawProduct["price"] | RawProduct["rating"]): number {
  if (typeof value === "number") return value
  const parsed = parseFloat(value?.toString() || "0")
  return Number.isFinite(parsed) ? parsed : 0
}

function tokenize(value: string): string[] {
  return (value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter(
    (word) => word.length > 1,
  )
}

export function runCustomShoppingAgent(
  locale: string,
  messages: { role: string; content: string }[],
  catalog: RawProduct[],
): ShoppingAgentResult {
  const isBn = locale === "bn"
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content || ""
  const query = lastUserMsg.trim().toLowerCase()
  const queryTokens = tokenize(query)

  const toSuggestion = (p: RawProduct): ProductSuggestion => {
    const priceNum = toNumber(p.price)
    const stock = p.stock
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: priceNum,
      displayPrice: formatPrice(priceNum, locale),
      stock,
      availability:
        stock > 0
          ? isBn
            ? `স্টকে আছে (${stock} টি)`
            : `In stock (${stock})`
          : isBn
            ? "স্টকে নেই"
            : "Out of stock",
      isFeatured: Boolean(p.isFeatured),
    }
  }

  const suggestionsOf = (items: RawProduct[]) => items.map(toSuggestion)
  const inStock = catalog.filter((p) => p.stock > 0)
  const featured = catalog
    .filter((p) => p.isFeatured || p.stock > 0)
    .slice(0, 4)

  // Bengali category keywords that map to English categories in the catalog
  const categoryBnKeywords: Record<string, string[]> = {
    bags: ["ব্যাগ", "ব্যাগগুলো", "ব্যাগের"],
    clothing: ["পোশাক", "পোশাকগুলো", "পোশাকের", "কাপড়", "শার্ট", "প্যান্ট", "টি-শার্ট"],
    footwear: ["জুতা", "জুতাগুলো", "জুতের", "ফুটওয়েয়ার", "স্নিকার্স", "বুট"],
    accessories: ["অনুষঙ্গ", "এক্সেসরি", "আভূষণ", "ঘড়ি", "বেল্ট"],
    electronics: ["ইলেকট্রনিক্স", "ইলেকট্রনিক", "গ্যাজেট", "মোবাইল", "ল্যাপটপ", "কম্পিউটার", "ফোন"],
    home: ["বাড়ি", "রান্নাঘর", "হোম", "কিচেন", "ফার্নিচার"],
    "Home & Kitchen": ["হোম এন্ড কিচেন", "বাড়ি ও রান্নাঘর", "রান্নাঘর", "কিচেন"],
    "Home & Office": ["হোম এন্ড অফিস", "বাড়ি ও অফিস", "অফিস"],
    "Health & Household": ["হেলথ এন্ড হাউসহোল্ড", "স্বাস্থ্য ও ঘরোয়া"],
    "Beauty & Personal Care": ["বিউটি এন্ড পারসোনাল কেয়ার", "সৌন্দর্য ও ব্যক্তিগত যত্ন"],
    "Sports & Outdoors": ["স্পোর্টস এন্ড আউটডোর্স", "খেলাধুলা ও বাইরের"],
    "Tools & Home Improvement": ["টুলস এন্ড হোম ইম্প্রুভমেন্ট", "যন্ত্রপাতি ও ঘর উন্নতি"],
    "Office Products": ["অফিস প্রোডাক্টস", "অফিস সামগ্রী"],
    "Toys & Games": ["টয়েজ এন্ড গেমস", "খেলনা ও গেম"],
    Automotive: ["অটোমোটিভ", "গাড়ি"],
    Baby: ["বেবি", "শিশু"],
    "Pet Supplies": ["পেট সাপ্লাইজ", "পালতু প্রাণীর সামগ্রী"],
    "Clothing, Shoes & Jewelry": ["ক্লোথিং, শুজ অ্যান্ড জুয়েলারি", "পোশাক জুতা আভূষণ"],
    "Cell Phones & Accessories": ["সেল ফোন অ্যান্ড এক্সেসরি", "মোবাইল ফোন অ্যাক্সেসরি"],
    "Industrial & Scientific": ["ইন্ডাস্ট্রিয়াল অ্যান্ড সায়েন্টিফিক", "শিল্প ও বিজ্ঞান"],
    "Video Games": ["ভিডিও গেমস", "ভিডিও গেম"],
    "Grocery & Gourmet Food": ["গ্রসারি অ্যান্ড গার্মেট ফুড", "খাদ্য সামগ্রী"],
    "Kitchen & Dining": ["কিচেন অ্যান্ড ডাইনিং", "রান্নাঘর ও ডাইনিং"],
    Appliances: ["অ্যাপ্লায়েন্সেস", "উপকরণ"],
    "Musical Instruments": ["মিউজিক্যাল ইনস্ট্রুমেন্টস", "সঙ্গীত বাদ্য"],
  }

  const uniqueBrands = [...new Set(catalog.map((p) => p.brand).filter(Boolean))]
  const uniqueCategories = [
    ...new Set(catalog.map((p) => p.category).filter(Boolean)),
  ]

  // Score products against the query (name / brand / category / tokens)
  const scored = catalog
    .map((prod) => {
      let score = 0
      const prodName = prod.name.toLowerCase()
      const prodBrand = prod.brand.toLowerCase()
      const prodCat = prod.category.toLowerCase()

      if (query.includes(prodName) || prodName.includes(query)) score += 15
      if (prodBrand && query.includes(prodBrand)) score += 8
      if (prodCat && query.includes(prodCat)) score += 6

      for (const word of queryTokens) {
        if (prodName.includes(word)) score += 3
        if (prodBrand.includes(word)) score += 2
        if (prodCat.includes(word)) score += 2
      }

      if (isBn) {
        for (const [engCategory, bnKeywords] of Object.entries(
          categoryBnKeywords,
        )) {
          const bnCategory = bnKeywords[0].toLowerCase()
          if (prodCat === engCategory.toLowerCase() || prodCat === bnCategory) {
            for (const bnKeyword of bnKeywords) {
              if (query.includes(bnKeyword)) {
                score += 10
                break
              }
            }
          }
        }
      }

      if (prod.isFeatured) score += 1
      if (prod.stock > 0) score += 1
      return { product: prod, score }
    })
    .sort((a, b) => b.score - a.score)

  const matched = scored.filter((s) => s.score > 0).map((s) => s.product)

  const listBlock = (items: RawProduct[]) =>
    suggestionsOf(items)
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}** — ${p.displayPrice} · ${p.availability}`,
      )
      .join("\n")

  // 1) Greeting
  const isGreeting =
    /^(hi|hello|hey|greetings|সালাম|হাই|হ্যালো|নমস্কার|কেমন আছেন|কেমন আছো)/i.test(
      query,
    ) || query.length < 3

  if (isGreeting && matched.length === 0) {
    const content = isBn
      ? `হ্যালো! আমি ক্সিনোরা (Kinora) এর এআই শপিং অ্যাসিস্ট্যান্ট। 👋\n\nআমি কীভাবে আপনাকে সাহায্য করতে পারি? আপনি আমাকে:\n- 🛍️ পণ্যের বিবরণ বা সেরা পণ্যের সুপারিশ সম্পর্কে জিজ্ঞাসা করতে পারেন\n- ⚖️ একাধিক পণ্যের মধ্যে তুলনা দেখতে পারেন\n- 📦 কোনো পণ্য স্টকে আছে কিনা জানতে পারেন\n- 💰 নির্দিষ্ট বাজেটের মধ্যে পণ্য খুঁজে নিতে পারেন\n- 🏷️ ব্র্যান্ড বা ক্যাটাগরি অনুযায়ী পণ্য দেখতে পারেন\n- ⭐ সেরা রেটিং বা নতুন পণ্য খুঁজে নিতে পারেন`
      : `Hello! I’m Kinora’s AI Shopping Assistant. 👋\n\nHow can I assist you today? You can ask me to:\n- 🛍️ Recommend popular or top-rated products\n- ⚖️ Compare two or more products\n- 📦 Check stock availability for any item\n- 💰 Find items within your specific budget\n- 🏷️ Browse by brand or category\n- ⭐ Discover top-rated or newest arrivals`

    return { content, products: suggestionsOf(featured) }
  }

  // 2) Help / capabilities
  if (/(help|what can you do|options|সাহায্য|কি করতে পারো|কী করতে পারো|সম্ভাবনা)/i.test(query)) {
    const content = isBn
      ? `আমি আপনার জন্য নিচের কাজগুলো করতে পারি:\n- 🔎 পণ্য খোঁজা ও বিবরণ\n- 💰 বাজেট অনুযায়ী পণ্য (যেমন: ৫০০ টাকার নিচে)\n- 📊 দামের রেঞ্জ (যেমন: ২০০ থেকে ৮০০ টাকা)\n- 🏷️ ব্র্যান্ড অনুযায়ী (যেমন: Nike)\n- 📁 ক্যাটাগরি অনুযায়ী (যেমন: ইলেকট্রনিক্স)\n- ⭐ সেরা রেটিং / 🆕 নতুন পণ্য\n- 📦 স্টক / স্টকে নেই পণ্য\n- ⚖️ পণ্য তুলনা\n- 🔗 অনুরূপ পণ্যের সাজেশন\n\nআপনি কী জানতে চান?`
      : `Here is what I can do for you:\n- 🔎 Search products and show details\n- 💰 Find items within a budget (e.g. under 500)\n- 📊 Search a price range (e.g. 200 to 800)\n- 🏷️ Browse by brand (e.g. Nike)\n- 📁 Browse by category (e.g. electronics)\n- ⭐ Show top-rated / 🆕 newest products\n- 📦 Check in-stock / out-of-stock items\n- ⚖️ Compare products\n- 🔗 Find similar / related items\n\nWhat would you like to know?`
    return { content, products: suggestionsOf(featured) }
  }

  // 3) Thanks / farewell
  if (/(thank|thanks|ধন্যবাদ|আবার|bye|goodbye|বিদায়)/i.test(query)) {
    const content = isBn
      ? "আপনাকে স্বাগতম! 🙏 আরও কোনো সাহায্য দরকার হলে আমাকে জিজ্ঞাসা করুন।"
      : "You’re welcome! 🙏 Feel free to ask if you need anything else."
    return { content, products: [] }
  }

  // 4) Comparison (2–3 items)
  const isComparison =
    /(compare|versus|vs|difference|between|তুলনা|পার্থক্য|কোনটা ভালো)/i.test(query)
  if (isComparison) {
    const compareItems =
      matched.length >= 2 ? matched.slice(0, 3) : inStock.slice(0, 2)

    if (compareItems.length < 2) {
      const content = isBn
        ? "তুলনা করার জন্য যথেষ্ট পণ্য পাওয়া যায়নি। আমাদের ক্যাটালগে একাধিক পণ্য যোগ করা হলে তুলনা দেখানো হবে।"
        : "Not enough products available to perform a comparison. Please check back when more items are listed."
      return { content, products: suggestionsOf(compareItems) }
    }

    const rows = compareItems
      .map((p, i) => {
        const s = toSuggestion(p)
        return (
          `**${i + 1}. ${s.name}**\n` +
          `- 🏷️ **${isBn ? "ব্র্যান্ড" : "Brand"}:** ${s.brand}\n` +
          `- 📁 **${isBn ? "ক্যাটাগরি" : "Category"}:** ${s.category}\n` +
          `- 💰 **${isBn ? "দাম" : "Price"}:** ${s.displayPrice}\n` +
          `- ⭐ **${isBn ? "রেটিং" : "Rating"}:** ${toNumber(p.rating).toFixed(1)}\n` +
          `- 📦 **${isBn ? "অবস্থা" : "Stock"}:** ${s.availability}`
        )
      })
      .join("\n\n")

    const cheapest = compareItems.reduce((a, b) =>
      toNumber(a.price) <= toNumber(b.price) ? a : b,
    )
    const content = isBn
      ? `### ⚖️ পণ্যের তুলনা:\n\n${rows}\n\n💡 **সিদ্ধান্ত:** বাজেট-বান্ধব পছন্দ হলে **${cheapest.name}** বেছে নিতে পারেন।`
      : `### ⚖️ Product Comparison:\n\n${rows}\n\n💡 **Recommendation:** For the best value, consider **${cheapest.name}**.`

    return { content, products: suggestionsOf(compareItems) }
  }

  // 5) Price range (between X and Y / X to Y)
  const rangeMatch = query.match(
    /(\d+(?:\.\d+)?)\s*(?:-|টাকা|to|taka|bdt|৳|\$)?\s*(?:and|টাকা থেকে|to|-)\s*(?:৳|\$|bdt|taka)?\s*(\d+(?:\.\d+)?)/i,
  )
  const betweenMatch = query.match(
    /(?:between|মধ্যে|থেকে)\s*(\d+(?:\.\d+)?)\s*(?:and|এবং|to|-)\s*(\d+(?:\.\d+)?)/i,
  )
  const rangePair = betweenMatch || rangeMatch
  if (rangePair) {
    const low = Math.min(parseFloat(rangePair[1]), parseFloat(rangePair[2]))
    const high = Math.max(parseFloat(rangePair[1]), parseFloat(rangePair[2]))
    const inRange = catalog
      .filter((p) => toNumber(p.price) >= low && toNumber(p.price) <= high)
      .slice(0, 6)
    const content = isBn
      ? `${formatPrice(low, locale)} থেকে ${formatPrice(high, locale)} এর মধ্যে পাওয়া পণ্যসমূহ:`
      : `Products between ${formatPrice(low, locale)} and ${formatPrice(high, locale)}:`
    return {
      content: inRange.length
        ? `${content}\n\n${listBlock(inRange)}`
        : isBn
          ? "এই রেঞ্জে কোনো পণ্য পাওয়া যায়নি।"
          : "No products found in that range.",
      products: suggestionsOf(inRange.length ? inRange : featured),
    }
  }

  // 6) Budget (under / below / less than X)
  const isPriceQuery =
    /(price|cost|cheap|expensive|under|below|budget|less than|দাম|সস্তা|দামী|কম|বাজেট)/i.test(
      query,
    )
  const priceMatch = query.match(/(\d+(?:\.\d+)?)/)
  const priceThreshold = priceMatch ? parseFloat(priceMatch[1]) : null

  if (isPriceQuery && priceThreshold !== null && priceThreshold > 0) {
    const underBudget = catalog
      .filter((p) => toNumber(p.price) <= priceThreshold)
      .sort((a, b) => toNumber(a.price) - toNumber(b.price))
      .slice(0, 6)
    if (underBudget.length > 0) {
      const content = isBn
        ? `আপনার বাজেট (${formatPrice(priceThreshold, locale)}) এর মধ্যে পাওয়া পণ্যসমূহ:`
        : `Here are the available products under ${formatPrice(priceThreshold, locale)}:`
      return { content: `${content}\n\n${listBlock(underBudget)}`, products: suggestionsOf(underBudget) }
    }
    const cheapest = [...catalog]
      .sort((a, b) => toNumber(a.price) - toNumber(b.price))
      .slice(0, 3)
    const content = isBn
      ? `আপনার বাজেটের (${formatPrice(priceThreshold, locale)}) মধ্যে কোনো পণ্য পাওয়া যায়নি। তবে আমাদের সবচেয়ে সাশ্রয়ী পণ্যগুলি হলো:`
      : `No products were found directly under ${formatPrice(priceThreshold, locale)}. However, here are our most affordable options:`
    return { content: `${content}\n\n${listBlock(cheapest)}`, products: suggestionsOf(cheapest) }
  }

  // 7) Sort: cheapest / most expensive
  if (/(cheapest|lowest price|most expensive|highest price|সস্তা|সবচেয়ে সস্তা|দামী|সবচেয়ে দামী)/i.test(query)) {
    const desc = /(expensive|highest|দামী)/i.test(query)
    const sorted = [...catalog].sort((a, b) =>
      desc ? toNumber(b.price) - toNumber(a.price) : toNumber(a.price) - toNumber(b.price),
    ).slice(0, 5)
    const content = isBn
      ? desc
        ? "আমাদের সবচেয়ে দামী পণ্যগুলো:"
        : "আমাদের সবচেয়ে সস্তা পণ্যগুলো:"
      : desc
        ? "Our most expensive products:"
        : "Our cheapest products:"
    return { content: `${content}\n\n${listBlock(sorted)}`, products: suggestionsOf(sorted) }
  }

  // 8) Top rated
  if (/(top rated|best rated|highest rated|rating|রেটিং|সেরা রেটিং|সবচেয়ে ভালো)/i.test(query)) {
    const topRated = [...catalog]
      .sort((a, b) => toNumber(b.rating) - toNumber(a.rating))
      .slice(0, 5)
    const content = isBn
      ? "⭐ আমাদের সবচেয়ে উচ্চ রেটিংযুক্ত পণ্যগুলো:"
      : "⭐ Our top-rated products:"
    return { content: `${content}\n\n${listBlock(topRated)}`, products: suggestionsOf(topRated) }
  }

  // 9) Newest arrivals
  if (/(new|newest|arrival|latest|recent|নতুন|নতুন পণ্য|সাম্প্রতিক)/i.test(query)) {
    const newest = [...catalog]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt.toString()).getTime() : 0
        const tb = b.createdAt ? new Date(b.createdAt.toString()).getTime() : 0
        return tb - ta
      })
      .slice(0, 5)
    const content = isBn
      ? "🆕 আমাদের নতুন পণ্যগুলো:"
      : "🆕 Our newest arrivals:"
    return { content: `${content}\n\n${listBlock(newest)}`, products: suggestionsOf(newest) }
  }

  // 10) Out of stock
  if (/(out of stock|unavailable|স্টকে নেই|পাওয়া যাচ্ছে না)/i.test(query)) {
    const outOfStock = catalog.filter((p) => p.stock <= 0).slice(0, 5)
    const content = isBn
      ? outOfStock.length
        ? "এই পণ্যগুলো বর্তমানে স্টকে নেই:"
        : "সব পণ্য বর্তমানে স্টকে আছে। ✅"
      : outOfStock.length
        ? "These items are currently out of stock:"
        : "All products are currently in stock. ✅"
    return {
      content: outOfStock.length ? `${content}\n\n${listBlock(outOfStock)}` : content,
      products: suggestionsOf(outOfStock.length ? outOfStock : featured),
    }
  }

  // 11) In-stock only
  if (/(in stock|available now|only available|স্টকে আছে|উপলব্ধ)/i.test(query) && matched.length === 0) {
    const available = inStock.slice(0, 6)
    const content = isBn
      ? "✅ বর্তমানে স্টকে থাকা পণ্যগুলো:"
      : "✅ Products currently in stock:"
    return { content: `${content}\n\n${listBlock(available)}`, products: suggestionsOf(available) }
  }

  // 12) Brand search
  const brandHit = uniqueBrands.find((b) => b && query.includes(b.toLowerCase()))
  if (brandHit && !isComparison) {
    const brandProducts = catalog
      .filter((p) => p.brand.toLowerCase() === brandHit.toLowerCase())
      .slice(0, 6)
    const content = isBn
      ? `🏷️ **${brandHit}** ব্র্যান্ডের পণ্যগুলো:`
      : `🏷️ Products from **${brandHit}**:`
    return {
      content: brandProducts.length
        ? `${content}\n\n${listBlock(brandProducts)}`
        : isBn
          ? `${brandHit} ব্র্যান্ডের কোনো পণ্য পাওয়া যায়নি।`
          : `No products found for ${brandHit}.`,
      products: suggestionsOf(brandProducts.length ? brandProducts : featured),
    }
  }

  // 13) Category browse
  const categoryHit = uniqueCategories.find(
    (c) => c && (query.includes(c.toLowerCase()) || (isBn && queryTokens.some((t) => c.toLowerCase().includes(t)))),
  )
  const matchedCategory = categoryHit || matched[0]?.category
  if (matchedCategory && (isPriceQuery === false) && matched.length > 0 && !brandHit) {
    const catProducts = catalog
      .filter((p) => p.category === matchedCategory)
      .slice(0, 6)
    if (catProducts.length > 0) {
      const content = isBn
        ? `📁 **${matchedCategory}** ক্যাটাগরির পণ্যগুলো:`
        : `📁 Products in **${matchedCategory}**:`
      return { content: `${content}\n\n${listBlock(catProducts)}`, products: suggestionsOf(catProducts) }
    }
  }

  // 14) Count
  if (/(how many|count|total|কতটি|কতটা|সংখ্যা)/i.test(query)) {
    const content = isBn
      ? `আমাদের ক্যাটালগে মোট **${catalog.length}** টি পণ্য আছে, যার মধ্যে **${inStock.length}** টি স্টকে আছে।`
      : `Our catalog has **${catalog.length}** products in total, of which **${inStock.length}** are in stock.`
    return { content, products: suggestionsOf(featured) }
  }

  // 15) Product detail (specific product)
  const detailMatch = matched[0]
  if (detailMatch && !isPriceQuery && matched.length >= 1 && queryTokens.length >= 1 && !isRecommendationQuery(query)) {
    const s = toSuggestion(detailMatch)
    const desc = (detailMatch.description || "").toString().trim()
    const content = isBn
      ? `### 📦 ${s.name}\n- 🏷️ **ব্র্যান্ড:** ${s.brand}\n- 📁 **ক্যাটাগরি:** ${s.category}\n- 💰 **দাম:** ${s.displayPrice}\n- ⭐ **রেটিং:** ${toNumber(detailMatch.rating).toFixed(1)}\n- 📦 **অবস্থা:** ${s.availability}${desc ? `\n\n📝 ${desc.slice(0, 220)}` : ""}`
      : `### 📦 ${s.name}\n- 🏷️ **Brand:** ${s.brand}\n- 📁 **Category:** ${s.category}\n- 💰 **Price:** ${s.displayPrice}\n- ⭐ **Rating:** ${toNumber(detailMatch.rating).toFixed(1)}\n- 📦 **Stock:** ${s.availability}${desc ? `\n\n📝 ${desc.slice(0, 220)}` : ""}`
    return { content, products: [s] }
  }

  // 16) Similar / related products
  if (/(similar|related|like|alternative|অনুরূপ|মিলদার|বিকল্প)/i.test(query) && detailMatch) {
    const related = catalog
      .filter((p) => p.id !== detailMatch.id && p.category === detailMatch.category)
      .slice(0, 4)
    const content = isBn
      ? `**${detailMatch.name}** এর অনুরূপ পণ্যগুলো:`
      : `Products similar to **${detailMatch.name}**:`
    return {
      content: related.length ? `${content}\n\n${listBlock(related)}` : content,
      products: suggestionsOf(related.length ? related : featured),
    }
  }

  // 17) Surprise me / random
  if (/(surprise|random|যেকোনো|যা ইচ্ছে|একটি দেখাও)/i.test(query)) {
    const pick = inStock[Math.floor(Math.random() * inStock.length)] || catalog[0]
    const content = isBn
      ? `🎲 আপনার জন্য একটি সারপ্রাইজ পণ্য: **${pick?.name ?? ""}**`
      : `🎲 A surprise pick for you: **${pick?.name ?? ""}**`
    return { content, products: pick ? suggestionsOf([pick]) : [] }
  }

  // 18) Recommendation / featured
  if (isRecommendationQuery(query) || (matched.length === 0 && query.length > 0)) {
    const recs = matched.length > 0 ? matched.slice(0, 4) : featured
    const content = isBn
      ? matched.length > 0
        ? "আপনার অনুসন্ধানের সাথে মিল রেখে নিচে সেরা পণ্যগুলোর তালিকা দেওয়া হলো:"
        : "আমাদের স্টোরের সবচেয়ে জনপ্রিয় এবং সেরা পণ্যগুলির সুপারিশ করা হলো:"
      : matched.length > 0
        ? "Based on your request, here are our top matching recommendations:"
        : "Here are Kinora's top featured and recommended products:"
    return { content: `${content}\n\n${listBlock(recs)}`, products: suggestionsOf(recs) }
  }

  // 19) Availability (fallback for stock questions)
  if (/(stock|available|availability|have|স্টক|উপলব্ধ|আছে কি|পাওয়া যাবে)/i.test(query)) {
    const targetProducts = matched.length > 0 ? matched : inStock.slice(0, 4)
    const content = isBn
      ? "📦 **স্টক আপডেট:** বর্তমানে আমাদের পণ্যগুলোর প্রাপ্যতা নিচে দেওয়া হলো:"
      : "📦 **Stock Availability Update:** Here is the current stock status for our available items:"
    return { content: `${content}\n\n${listBlock(targetProducts)}`, products: suggestionsOf(targetProducts) }
  }

  // 20) Fallback
  const displayItems = matched.length > 0 ? matched.slice(0, 4) : catalog.slice(0, 3)
  const content = isBn
    ? "আপনাকে কীভাবে সাহায্য করতে পারি? আপনার পছন্দের পণ্য সম্পর্কে বিস্তারিত নিচে দেওয়া হলো:"
    : "Here are the relevant details for your search request:"
  return { content: `${content}\n\n${listBlock(displayItems)}`, products: suggestionsOf(displayItems) }
}

function isRecommendationQuery(query: string): boolean {
  return /(recommend|best|suggest|popular|top|featured|favorite|সুপারিশ|সেরা|পছন্দ|ভাল|ভালো|প্রস্তাব)/i.test(
    query,
  )
}