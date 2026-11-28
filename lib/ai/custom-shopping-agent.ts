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

export function runCustomShoppingAgent(
  locale: string,
  messages: { role: string; content: string }[],
  catalog: RawProduct[],
): ShoppingAgentResult {
  const isBn = locale === "bn"
  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content || ""
  const query = lastUserMsg.trim().toLowerCase()

  // Format catalog products into structured suggestions
  const formattedCatalog: ProductSuggestion[] = catalog.map((p) => {
    const priceNum =
      typeof p.price === "number"
        ? p.price
        : parseFloat(p.price?.toString() || "0")
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: priceNum,
      displayPrice: formatPrice(priceNum, locale),
      stock: p.stock,
      availability:
        p.stock > 0
          ? isBn
            ? `স্টকে আছে (${p.stock} টি)`
            : `In stock (${p.stock})`
          : isBn
            ? "স্টকে নেই"
            : "Out of stock",
      isFeatured: Boolean(p.isFeatured),
    }
  })

  // Detect query intents
  const isGreeting =
    /^(hi|hello|hey|greetings|সালাম|হাই|হ্যালো|নমস্কার|কেমন আছেন|কেমন আছো)/i.test(
      query,
    ) || query.length < 3

  const isComparison =
    /(compare|versus|vs|difference|between|তুলনা|পার্থক্য|কোনটা ভালো)/i.test(
      query,
    )

  const isAvailability =
    /(stock|available|availability|in stock|have|স্টক|উপলব্ধ|আছে কি|পাওয়া যাবে)/i.test(
      query,
    )

  // Bengali category keywords that map to English categories in the catalog
    const categoryBnKeywords = {
      bags: ["ব্যাগ", "ব্যাগগুলো", "ব্যাগের", "ব্যাগদেখান", "ব্যাগ দেখান"],
      clothing: ["পোশাক", "পোশাকগুলো", "পোশাকের", "কাপাড়", "শার্ট", "প্যান্ট", "টি-শার্ট"],
      footwear: ["জুতা", "জুতাগুলো", "জুতের", "ফুটওয়েয়ার", "স্নিকার্স", "বুট"],
      accessories: ["অনুষঙ্গ", "এক্সেসরি", "আভূষণ", "ঘড়ি", "বেল্ট", "ব্যাগ"],
      electronics: ["ইলেকট্রনিক্স", "ইলেকট্রনিক", "গ্যাজেট", "মোবাইল", "ল্যাপটপ", "ল্যাপটপ চাই", "ল্যাপটপ দেখাও", "কম্পিউটার", "ফোন"],
      home: ["বাড়ি", "রান্নাঘর", "হোম", "কিচেন", "ফার্নিচার"],
      // Common category translations from the catalog (English category names in DB)
      "Home & Kitchen": ["হোম এন্ড কিচেন", "বাড়ি ও রান্নাঘর", "রান্নাঘর", "কিচেন", "বাড়ি ও রান্নাঘর"],
      "Home & Office": ["হোম এন্ড অফিস", "বাড়ি ও অফিস", "অফিস"],
      "Health & Household": ["হেলথ এন্ড হাউসহোল্ড", "স্বাস্থ্য ও ঘরোয়া"],
      "Beauty & Personal Care": ["বিউটি এন্ড পারসোনাল কেয়ার", "সৌন্দর্য ও ব্যক্তিগত যত্ন"],
      "Sports & Outdoors": ["স্পোর্টস এন্ড আউটডোর্স", "খেলাধুলা ও বাইরের"],
      "Tools & Home Improvement": ["টুলস এন্ড হোম ইম্প্রুভমেন্ট", "যন্ত্রপাতি ও ঘর উন্নতি"],
      "Office Products": ["অফিস প্রোডাক্টস", "অফিস সামগ্রী"],
      "Toys & Games": ["টয়েজ এন্ড গেমস", "খেলনা ও গেম"],
      "Automotive": ["অটোমোটিভ", "গাড়ি"],
      "Baby": ["বেবি", "শিশু"],
      "Pet Supplies": ["পেট সাপ্লাইজ", "পালতু প্রাণীর সামগ্রী"],
      "Clothing, Shoes & Jewelry": ["ক্লোথিং, শুজ অ্যান্ড জুয়েলারি", "পোশাক জুতা আভূষণ", "কাপাড় জুতা আভূষণ"],
      "Cell Phones & Accessories": ["সেল ফোন অ্যান্ড এক্সেসরি", "মোবাইল ফোন অ্যাক্সেসরি", "ফোন এক্সেসরি"],
      "Industrial & Scientific": ["ইন্ডাস্ট্রিয়াল অ্যান্ড সায়েন্টিফিক", "শিল্প ও বিজ্ঞান"],
      "Video Games": ["ভিডিও গেমস", "ভিডিও গেম"],
      "Grocery & Gourmet Food": ["গ্রসারি অ্যান্ড গার্মেট ফুড", "খাদ্য সামগ্রী"],
      "Motorcycle & Powersports": ["মটরসাইকেল অ্যান্ড পাওয়ারস্পোর্টস", "মোটরসাইকেল"],
      "Kitchen & Dining": ["কিচেন অ্যান্ড ডাইনিং", "রান্নাঘর ও ডাইনিং"],
      "CDs & Vinyl": ["সিডি অ্যান্ড ভাইনাইল", "সিডি"],
      "Power & Hand Tools": ["পাওয়ার অ্যান্ড হ্যান্ড টুলস", "বিদ্যুৎ ও হাতের সরঞ্জাম"],
      "Appliances": ["অ্যাপ্লায়েন্সেস", "উপকরণ"],
      "Musical Instruments": ["মিউজিক্যাল ইনস্ট্রুমেন্টস", "সঙ্গীত বাদ্য"],
    }

  const isRecommendation =
    /(recommend|best|suggest|popular|top|featured|favorite|সুপারিশ|সেরা|পছন্দ|ভাল|ভালো|প্রস্তাব|ব্যাগ|ব্যাগগুলো|ব্যাগের)/i.test(
      query,
    )

  const isPriceQuery =
    /(price|cost|cheap|expensive|under|below|budget|less than|দাম|সস্তা|দামী|কম|বাজেট)/i.test(
      query,
    ) || /\d+/.test(query)

  // Extract price threshold if present
  let priceThreshold: number | null = null
  const priceMatch = query.match(/(\d+(\.\d+)?)/)
  if (priceMatch) {
    const extractedNum = parseFloat(priceMatch[1])
    if (extractedNum > 0) {
      priceThreshold = extractedNum
    }
  }

  // Score products against query
  const scoredProducts = formattedCatalog.map((prod) => {
    let score = 0
    const prodName = prod.name.toLowerCase()
    const prodBrand = prod.brand.toLowerCase()
    const prodCat = prod.category.toLowerCase()

    if (query.includes(prodName) || prodName.includes(query)) score += 15
    if (query.includes(prodBrand)) score += 8
    if (query.includes(prodCat)) score += 6

    // Word overlap match
    const words = query.split(/\s+/).filter((w) => w.length > 2)
    for (const word of words) {
      if (prodName.includes(word)) score += 3
      if (prodBrand.includes(word)) score += 2
      if (prodCat.includes(word)) score += 2
    }

    // Bengali category keyword matching - boost score if Bengali category keyword matches category (English or Bengali)
    if (isBn) {
      for (const [engCategory, bnKeywords] of Object.entries(categoryBnKeywords)) {
        // Check if product category matches English or Bengali version (case-insensitive)
        const bnCategory = bnKeywords[0].toLowerCase() // First keyword is the main category name
        if (prodCat === engCategory.toLowerCase() || prodCat === bnCategory) {
          for (const bnKeyword of bnKeywords) {
            if (query.includes(bnKeyword)) {
              score += 10 // Strong boost for category match
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

  scoredProducts.sort((a, b) => b.score - a.score)
  const matchedProducts = scoredProducts
    .filter((sp) => sp.score > 0)
    .map((sp) => sp.product)

  // --- Intent: Greeting ---
  if (isGreeting && matchedProducts.length === 0) {
    const featured = formattedCatalog
      .filter((p) => p.isFeatured || p.stock > 0)
      .slice(0, 3)
    const content = isBn
      ? `হ্যালো! আমি ক্সিনোরা (Kinora) এর এআই শপিং অ্যাসিস্ট্যান্ট। 👋\n\nআমি কীভাবে আপনাকে সাহায্য করতে পারি? আপনি আমাকে:\n- 🛍️ পণ্যের বিবরণ বা সেরা পণ্যের সুপারিশ সম্পর্কে জিজ্ঞাসা করতে পারেন\n- ⚖️ একাধিক পণ্যের মধ্যে তুলনা দেখতে পারেন\n- 📦 কোনো পণ্য স্টকে আছে কিনা জানতে পারেন\n- 💰 নির্দিষ্ট বাজেটের মধ্যে পণ্য খুঁজে নিতে পারেন`
      : `Hello! I’m Kinora’s AI Shopping Assistant. 👋\n\nHow can I assist you today? You can ask me to:\n- 🛍️ Recommend popular or top-rated products\n- ⚖️ Compare two or more products\n- 📦 Check stock availability for any item\n- 💰 Find items within your specific budget`

    return { content, products: featured }
  }

  // --- Intent: Comparison ---
  if (isComparison) {
    const compareItems =
      matchedProducts.length >= 2
        ? matchedProducts.slice(0, 2)
        : formattedCatalog.slice(0, 2)

    if (compareItems.length < 2) {
      const content = isBn
        ? "তুলনা করার জন্য যথেষ্ট পণ্য পাওয়া যায়নি। আমাদের ক্যাটালগে একাধিক পণ্য যোগ করা হলে তুলনা দেখানো হবে।"
        : "Not enough products available to perform a comparison. Please check back when more items are listed."
      return { content, products: compareItems }
    }

    const [p1, p2] = compareItems
    const content = isBn
      ? `### ⚖️ পণ্যের তুলনা:\n\n` +
        `**১. ${p1.name}**\n` +
        `- 🏷️ **ব্র্যান্ড:** ${p1.brand}\n` +
        `- 📁 **ক্যাটাগরি:** ${p1.category}\n` +
        `- 💰 **দাম:** ${p1.displayPrice}\n` +
        `- 📦 **অবস্থা:** ${p1.availability}\n\n` +
        `**২. ${p2.name}**\n` +
        `- 🏷️ **ব্র্যান্ড:** ${p2.brand}\n` +
        `- 📁 **ক্যাটাগরি:** ${p2.category}\n` +
        `- 💰 **দাম:** ${p2.displayPrice}\n` +
        `- 📦 **অবস্থা:** ${p2.availability}\n\n` +
        `💡 **সিদ্ধান্ত:** আপনি যদি বাজেট-বান্ধব পণ্য চান তবে **${
          p1.price <= p2.price ? p1.name : p2.name
        }** বেছে নিতে পারেন।`
      : `### ⚖️ Product Comparison:\n\n` +
        `**1. ${p1.name}**\n` +
        `- 🏷️ **Brand:** ${p1.brand}\n` +
        `- 📁 **Category:** ${p1.category}\n` +
        `- 💰 **Price:** ${p1.displayPrice}\n` +
        `- 📦 **Stock:** ${p1.availability}\n\n` +
        `**2. ${p2.name}**\n` +
        `- 🏷️ **Brand:** ${p2.brand}\n` +
        `- 📁 **Category:** ${p2.category}\n` +
        `- 💰 **Price:** ${p2.displayPrice}\n` +
        `- 📦 **Stock:** ${p2.availability}\n\n` +
        `💡 **Recommendation:** For the best value, consider **${
          p1.price <= p2.price ? p1.name : p2.name
        }**.`

    return { content, products: [p1, p2] }
  }

  // --- Intent: Price / Budget Search ---
  if (isPriceQuery && priceThreshold !== null) {
    const underBudget = formattedCatalog
      .filter((p) => p.price <= priceThreshold!)
      .slice(0, 4)

    if (underBudget.length > 0) {
      const content = isBn
        ? `আপনার বাজেট (${formatPrice(
            priceThreshold,
            locale,
          )}) এর মধ্যে পাওয়া পণ্যসমূহ:`
        : `Here are the available products under ${formatPrice(
            priceThreshold,
            locale,
          )}:`
      return { content, products: underBudget }
    } else {
      const cheapest = [...formattedCatalog]
        .sort((a, b) => a.price - b.price)
        .slice(0, 3)
      const content = isBn
        ? `আপনার বাজেটের (${formatPrice(
            priceThreshold,
            locale,
          )}) মধ্যে কোনো পণ্য পাওয়া যায়নি। তবে আমাদের সবচেয়ে সাশ্রয়ী পণ্যগুলি হলো:`
        : `No products were found directly under ${formatPrice(
            priceThreshold,
            locale,
          )}. However, here are our most affordable options:`
      return { content, products: cheapest }
    }
  }

  // --- Intent: Stock / Availability ---
  if (isAvailability) {
    const targetProducts =
      matchedProducts.length > 0
        ? matchedProducts
        : formattedCatalog.filter((p) => p.stock > 0).slice(0, 4)

    const content = isBn
      ? `📦 **স্টক আপডেট:** বর্তমানে আমাদের পণ্যগুলোর প্রাপ্যতা নিচে দেওয়া হলো:`
      : `📦 **Stock Availability Update:** Here is the current stock status for our available items:`

    return { content, products: targetProducts }
  }

  // --- Intent: Recommendation / Best Items ---
  if (isRecommendation || (matchedProducts.length === 0 && query.length > 0)) {
    const recs =
      matchedProducts.length > 0
        ? matchedProducts.slice(0, 4)
        : formattedCatalog
            .filter((p) => p.isFeatured || p.stock > 0)
            .slice(0, 4)

    const content = isBn
      ? matchedProducts.length > 0
        ? `আপনার অনুসন্ধানের সাথে মিল রেখে নিচে সেরা পণ্যগুলোর তালিকা দেওয়া হলো:`
        : `আমাদের স্টোরের সবচেয়ে জনপ্রিয় এবং সেরা পণ্যগুলির সুপারিশ করা হলো:`
      : matchedProducts.length > 0
        ? `Based on your request, here are our top matching recommendations:`
        : `Here are Kinora's top featured and recommended products:`

    return { content, products: recs }
  }

  // --- Fallback / Specific Match ---
  const displayItems =
    matchedProducts.length > 0
      ? matchedProducts.slice(0, 4)
      : formattedCatalog.slice(0, 3)

  const content = isBn
    ? `আপনাকে কীভাবে সাহায্য করতে পারি? আপনার পছন্দের পণ্য সম্পর্কে বিস্তারিত নিচে দেওয়া হলো:`
    : `Here are the relevant details for your search request:`

  return { content, products: displayItems }
}
