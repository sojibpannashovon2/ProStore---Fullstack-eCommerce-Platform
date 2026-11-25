export function getUsdToBdtRate(): number | null {
  const configuredRate = process.env.NEXT_PUBLIC_USD_TO_BDT_RATE?.trim()
  const rate = configuredRate ? Number(configuredRate) : 123
  return Number.isFinite(rate) && rate > 0 ? rate : null
}

export function convertUsdToBdt(amount: number): number {
  const rate = getUsdToBdtRate()
  if (!rate) {
    throw new Error(
      "Set NEXT_PUBLIC_USD_TO_BDT_RATE to a positive BDT/USD rate",
    )
  }

  return Math.round((amount * rate + Number.EPSILON) * 100) / 100
}
