'use client'

import { useReadContract } from 'wagmi'
import { CONTRACTS } from '@/utils/config'
import { readerAbi } from '@/utils/abi/reader'

// Market Discovery & Order-book View functions as per Kandel_Implementation_Plan.md

export function useOpenMarkets() {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'openMarkets',
    args: [true], // withConfig = true
  })
}

export function useOfferList(outboundToken: `0x${string}`, inboundToken: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'offerList',
    args: [
      {
        outbound_tkn: outboundToken,
        inbound_tkn: inboundToken,
        tickSpacing: 1n,
      },
      0n, // fromId
      1000n, // maxOffers
    ],
    query: {
      enabled: Boolean(outboundToken && inboundToken),
    },
  })
}

export function useGlobalConfig() {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'globalUnpacked',
  })
}

export function useLocalConfig(outboundToken: `0x${string}`, inboundToken: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'localUnpacked',
    args: [
      {
        outbound_tkn: outboundToken,
        inbound_tkn: inboundToken,
        tickSpacing: 1n,
      },
    ],
    query: {
      enabled: Boolean(outboundToken && inboundToken),
    },
  })
}

export function useMarketConfig(tkn0: `0x${string}`, tkn1: `0x${string}`) {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'marketConfig',
    args: [
      {
        tkn0,
        tkn1,
        tickSpacing: 1n,
      },
    ],
    query: {
      enabled: Boolean(tkn0 && tkn1),
    },
  })
}