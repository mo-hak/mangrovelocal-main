'use client'

import { useReadContract, useAccount } from 'wagmi'
import { useState, useEffect } from 'react'
import { kandelLibABI } from '@/utils/abi/kandelLib'
import { useTokenInfo } from './useTokenInfo'

export interface KandelPosition {
  address: `0x${string}`
  owner: `0x${string}`
  baseToken: `0x${string}`
  quoteToken: `0x${string}`
  params: {
    gasprice: bigint
    gasreq: bigint
    stepSize: bigint
    pricePoints: bigint
  }
  baseQuoteTickOffset: bigint
  baseReserve: bigint
  quoteReserve: bigint
  baseOfferedVolume: bigint
  quoteOfferedVolume: bigint
}

export function useKandelPosition(kandelAddress: `0x${string}` | undefined) {
  const { address: userAddress } = useAccount()
  
  // Fetch Kandel parameters
  const { data: params, isLoading: paramsLoading, error: paramsError } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'params',
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Fetch base/quote tick offset
  const { data: baseQuoteTickOffset } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'baseQuoteTickOffset',
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Fetch base token reserve balance (asks side - index 0)
  const { data: baseReserve } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'reserveBalance',
    args: [0], // 0 for asks (base token)
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Fetch quote token reserve balance (bids side - index 1)
  const { data: quoteReserve } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'reserveBalance',
    args: [1], // 1 for bids (quote token)
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Fetch base token offered volume (asks side - index 0)
  const { data: baseOfferedVolume } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'offeredVolume',
    args: [0], // 0 for asks (base token)
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Fetch quote token offered volume (bids side - index 1)
  const { data: quoteOfferedVolume } = useReadContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'offeredVolume',
    args: [1], // 1 for bids (quote token)
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Combine all data into a position object
  const position: KandelPosition | null = kandelAddress && params && baseQuoteTickOffset !== undefined && 
    baseReserve !== undefined && quoteReserve !== undefined && 
    baseOfferedVolume !== undefined && quoteOfferedVolume !== undefined ? {
    address: kandelAddress,
    owner: userAddress || '0x0',
    baseToken: '0x0', // Will be set by parent component
    quoteToken: '0x0', // Will be set by parent component
    params: params as any,
    baseQuoteTickOffset: baseQuoteTickOffset as bigint,
    baseReserve: baseReserve as bigint,
    quoteReserve: quoteReserve as bigint,
    baseOfferedVolume: baseOfferedVolume as bigint,
    quoteOfferedVolume: quoteOfferedVolume as bigint,
  } : null

  const isLoading = !kandelAddress || paramsLoading || params === undefined || baseQuoteTickOffset === undefined || 
               baseReserve === undefined || quoteReserve === undefined || 
               baseOfferedVolume === undefined || quoteOfferedVolume === undefined

  return {
    position,
    isLoading,
    error: paramsError ? `Failed to load position: ${paramsError.message}` : null,
  }
}

export function useKandelPositionWithTokens(
  kandelAddress: `0x${string}` | undefined,
  baseToken: `0x${string}` | undefined,
  quoteToken: `0x${string}` | undefined
) {
  const { position, isLoading, error } = useKandelPosition(kandelAddress)
  const baseTokenInfo = useTokenInfo(baseToken)
  const quoteTokenInfo = useTokenInfo(quoteToken)

  const positionWithTokens: (KandelPosition & {
    baseTokenInfo: typeof baseTokenInfo
    quoteTokenInfo: typeof quoteTokenInfo
  }) | null = position && baseToken && quoteToken ? {
    ...position,
    baseToken,
    quoteToken,
    baseTokenInfo,
    quoteTokenInfo,
  } : null

  return {
    position: positionWithTokens,
    isLoading: isLoading || !baseTokenInfo.symbol || !quoteTokenInfo.symbol,
    error,
  }
}