'use client'

import { useState } from 'react'
import { useOfferList, useOpenMarkets } from '@/hooks/useMangrove'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { TokenPairDisplay, TokenDisplay } from './TokenDisplay'
import { CONTRACTS } from '@/utils/config'
import { formatUnits } from 'viem'
import { Market } from '@/types/kandel'

interface OrderBookProps {
  userKandelAddresses?: `0x${string}`[]
}

export function OrderBook({ userKandelAddresses = [] }: OrderBookProps) {
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number>(0)
  
  // Fetch all open markets
  const { data: marketsData, isLoading: marketsLoading } = useOpenMarkets()
  const markets = marketsData?.[0] || []
  const selectedMarket = markets[selectedMarketIndex]
  
  // Fetch token info for selected market tokens
  const token0Info = useTokenInfo(selectedMarket?.tkn0 || '0x0')
  const token1Info = useTokenInfo(selectedMarket?.tkn1 || '0x0')
  
  // Fetch offers for selected market (bids: tkn1 -> tkn0)
  const { data: bidsData, isLoading: bidsLoading, refetch: refetchBids } = useOfferList(
    selectedMarket?.tkn1,
    selectedMarket?.tkn0
  )
  
  // Fetch offers for selected market (asks: tkn0 -> tkn1) 
  const { data: asksData, isLoading: asksLoading, refetch: refetchAsks } = useOfferList(
    selectedMarket?.tkn0,
    selectedMarket?.tkn1
  )

  // Helper function to format token pair for display
  const formatTokenPair = (tkn0: `0x${string}`, tkn1: `0x${string}`) => {
    const token0 = Object.values(CONTRACTS).includes(tkn0) 
      ? Object.values(CONTRACTS).find(addr => addr === tkn0) === CONTRACTS.WETH ? 'WETH' : 'USDC'
      : `${tkn0.slice(0, 6)}...${tkn0.slice(-4)}`
    const token1 = Object.values(CONTRACTS).includes(tkn1)
      ? Object.values(CONTRACTS).find(addr => addr === tkn1) === CONTRACTS.WETH ? 'WETH' : 'USDC'  
      : `${tkn1.slice(0, 6)}...${tkn1.slice(-4)}`
    return `${token0}/${token1}`
  }

  const isUserOffer = (maker: `0x${string}`) => {
    return userKandelAddresses.includes(maker)
  }

  if (marketsLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="text-center py-4">Loading markets...</div>
      </div>
    )
  }

  if (!markets || markets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Order Book</h3>
        <div className="text-center py-4 text-gray-500">No markets available</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Order Book</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedMarketIndex}
            onChange={(e) => setSelectedMarketIndex(parseInt(e.target.value))}
            className="px-3 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            {markets.map((market, index) => (
              <option key={index} value={index}>
                {formatTokenPair(market.tkn0, market.tkn1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              refetchBids();
              refetchAsks();
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            disabled={bidsLoading || asksLoading}
          >
            {(bidsLoading || asksLoading) ? '⟳' : '↻'}
          </button>
        </div>
        {selectedMarket && (
          <div className="text-sm text-gray-500 mt-1">
            <TokenPairDisplay 
              token0={selectedMarket.tkn0} 
              token1={selectedMarket.tkn1}
              className="font-medium"
            />
          </div>
        )}
      </div>

      {(bidsLoading || asksLoading) && (
        <div className="text-center py-4">Loading order book...</div>
      )}

      {selectedMarket && (
        <div className="space-y-4">
          {/* Asks (Sell Orders) - tkn0 for tkn1 */}
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">
              Asks (Sell <TokenDisplay address={selectedMarket.tkn0} className="text-red-600" />)
            </h4>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-xs text-gray-500 pb-1 border-b">
                <span>Price</span>
                <span>Amount</span>
                <span>Total</span>
                <span>Maker</span>
              </div>
              {asksData && asksData.length >= 4 && asksData[2] && asksData[2].length > 0 ? (
                asksData[2].slice(0, 10).map((offer, index) => {
                  const offerId = asksData[1][index]
                  const offerDetail = asksData[3][index]
                  const tkn0Decimals = token0Info.decimals
                  const tkn1Decimals = token1Info.decimals
                  
                  
                  // For asks: wants tkn1, gives tkn0
                  // Tick represents log base 2 of price ratio scaled by some factor
                  // We need to convert this back to a human readable price
                  const tickNumber = Number(offer.tick)
                  
                  // Handle large tick values by using log math instead of direct power
                  let price: string
                  try {
                    // For very large ticks, use logarithmic approach
                    if (Math.abs(tickNumber) > 500) {
                      // Use natural log to avoid overflow: 2^tick = e^(tick * ln(2))
                      const logPrice = tickNumber * Math.log(2) 
                      const tickPriceRatio = Math.exp(logPrice)
                      
                      if (!Number.isFinite(tickPriceRatio)) {
                        // If still too large, approximate using scientific notation
                        price = tickNumber > 0 ? "∞" : "0.000000"
                      } else {
                        // Apply decimals adjustment
                        const decimalsAdjustment = Math.pow(10, Number(tkn1Decimals - tkn0Decimals))
                        price = (tickPriceRatio / Math.pow(2, 96) * decimalsAdjustment).toFixed(6)
                      }
                    } else {
                      // For smaller ticks, use the original method
                      const tickPow = Math.pow(2, tickNumber)
                      const tickBigInt = BigInt(Math.floor(tickPow))
                      const decimalsAdjustment = Number(tkn1Decimals - tkn0Decimals + 96)
                      price = (Number(formatUnits(tickBigInt, decimalsAdjustment))).toFixed(6)
                    }
                  } catch (error) {
                    console.warn('Price calculation failed for tick:', tickNumber, error)
                    price = "Invalid"
                  }
                  const amount = formatUnits(offer.gives, tkn0Decimals)
                  const isMyOffer = isUserOffer(offerDetail.maker)


                  return (
                    <div 
                      key={offerId.toString()} 
                      className={`grid grid-cols-4 text-xs py-1 ${
                        isMyOffer ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <span className="text-red-600">{price}</span>
                      <span>{Number(amount).toFixed(6)}</span>
                      <span>{(Number(price) * Number(amount)).toFixed(6)}</span>
                      <span>{offerDetail.maker.slice(0, 6)}...{offerDetail.maker.slice(-4)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-500 py-2">No asks available</div>
              )}
            </div>
          </div>

          {/* Spread */}
          <div className="text-center text-sm text-gray-500 py-2 border-y">
            <span>--- Spread ---</span>
          </div>

          {/* Bids (Buy Orders) - tkn1 for tkn0 */}
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2">
              Bids (Buy <TokenDisplay address={selectedMarket.tkn0} className="text-green-600" />)
            </h4>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-xs text-gray-500 pb-1 border-b">
                <span>Price</span>
                <span>Amount</span>
                <span>Total</span>
                <span>Maker</span>
              </div>
              {bidsData && bidsData.length >= 4 && bidsData[2] && bidsData[2].length > 0 ? (
                bidsData[2].slice(0, 10).map((offer, index) => {
                  const offerId = bidsData[1][index]
                  const offerDetail = bidsData[3][index]
                  const tkn0Decimals = token0Info.decimals
                  const tkn1Decimals = token1Info.decimals
                  
                  // For bids: wants tkn0, gives tkn1
                  const tickNumber = Number(offer.tick)
                  const tickPow = Math.pow(2, tickNumber)
                  
                  // Safety check to prevent Infinity conversion to BigInt
                  if (!Number.isFinite(tickPow) || tickPow > Number.MAX_SAFE_INTEGER) {
                    console.warn('Invalid tick value for offer:', offer.tick, 'resulting in:', tickPow)
                    return null // Skip this offer
                  }
                  
                  const tickBigInt = BigInt(Math.floor(tickPow))
                  const decimalsAdjustment = Number(tkn0Decimals - tkn1Decimals + 96)
                  const price = (1 / Number(formatUnits(tickBigInt, decimalsAdjustment))).toFixed(6)
                  const amount = formatUnits(offer.gives, tkn1Decimals)
                  const isMyOffer = isUserOffer(offerDetail.maker)

                  return (
                    <div 
                      key={offerId.toString()} 
                      className={`grid grid-cols-4 text-xs py-1 ${
                        isMyOffer ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <span className="text-green-600">{price}</span>
                      <span>{Number(amount).toFixed(6)}</span>
                      <span>{(Number(price) * Number(amount)).toFixed(6)}</span>
                      <span>{offerDetail.maker.slice(0, 6)}...{offerDetail.maker.slice(-4)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-500 py-2">No bids available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {userKandelAddresses.length > 0 && (
        <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
          <span className="text-blue-600">Blue highlighted orders are from your Kandel positions</span>
        </div>
      )}
    </div>
  )
}