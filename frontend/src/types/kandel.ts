export interface KandelParams {
  baseToken: `0x${string}`
  quoteToken: `0x${string}`
  minPrice: string
  maxPrice: string
  midPrice: string
  pricePoints: number
  stepSize: number
  baseAmount: string
  quoteAmount: string
}

export interface OfferData {
  id: bigint
  prev: bigint
  next: bigint
  wants: bigint
  gives: bigint
  gasreq: bigint
  gasprice: bigint
  maker: `0x${string}`
  live: boolean
}

export interface MarketData {
  base: `0x${string}`
  quote: `0x${string}`
  tickSpacing: bigint
  bids: OfferData[]
  asks: OfferData[]
}

export interface KandelPosition {
  address: `0x${string}`
  baseToken: `0x${string}`
  quoteToken: `0x${string}`
  params: {
    gasprice: bigint
    gasreq: bigint
    stepSize: number
    pricePoints: number
  }
  baseBalance: bigint
  quoteBalance: bigint
  baseOffered: bigint
  quoteOffered: bigint
}

export type params_ggsp = {
  gasprice: number;
  gasreq: number;
  stepSize: number;
  pricePoints: number; // This comes from a uint32, so it's a number
};