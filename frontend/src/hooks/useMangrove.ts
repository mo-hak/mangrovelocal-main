'use client'

import { useReadContract, useWriteContract } from 'wagmi'
import { CONTRACTS } from '@/utils/config'
import { readerAbi } from '@/abi/reader'
import { MangroveABI } from '@/abi/mangrove'
import { kandelSeederABI } from '@/abi/kandelSeeder'

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

export function useCreateKandel() {
  return useWriteContract()
}

export function useProvision(outboundToken: `0x${string}`, inboundToken: `0x${string}`, gasreq: bigint) {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'getProvision',
    args: [
      {
        outbound_tkn: outboundToken,
        inbound_tkn: inboundToken,
        tickSpacing: 1n,
      },
      gasreq,
      0n, // gasprice (0 means use current)
    ],
    query: {
      enabled: Boolean(outboundToken && inboundToken && gasreq),
    },
  })
}

export function useMinVolume(outboundToken: `0x${string}`, inboundToken: `0x${string}`, gasreq: bigint = 250_000n) {
  return useReadContract({
    address: CONTRACTS.READER,
    abi: readerAbi,
    functionName: 'minVolume',
    args: [
      {
        outbound_tkn: outboundToken,
        inbound_tkn: inboundToken,
        tickSpacing: 1n,
      },
      gasreq,
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