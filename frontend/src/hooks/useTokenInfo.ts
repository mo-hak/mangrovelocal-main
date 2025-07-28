'use client'

import { useReadContract } from 'wagmi'
import { erc20Abi } from '@/utils/abi/erc20'
import { CONTRACTS, TOKENS } from '@/utils/config'

export function useTokenInfo(tokenAddress: `0x${string}` | undefined) {
  // Check if it's a known token first (case-insensitive comparison)
  const knownToken = tokenAddress ? Object.values(TOKENS).find(token => token.address.toLowerCase() === tokenAddress.toLowerCase()) : undefined
  
  const { data: name, isLoading: nameLoading } = useReadContract({
    address: tokenAddress || '0x0',
    abi: erc20Abi,
    functionName: 'name',
    query: {
      enabled: Boolean(tokenAddress) && tokenAddress !== '0x0' && !knownToken,
    },
  })
  
  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress || '0x0',
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: Boolean(tokenAddress) && tokenAddress !== '0x0' && !knownToken,
    },
  })
  
  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: tokenAddress || '0x0',
    abi: erc20Abi,
    functionName: 'decimals',
    query: {
      enabled: Boolean(tokenAddress) && tokenAddress !== '0x0' && !knownToken,
    },
  })

  const isLoading = (nameLoading || symbolLoading || decimalsLoading) && !knownToken

  // Handle undefined addresses
  if (!tokenAddress || tokenAddress === '0x0') {
    return {
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      isLoading: false,
    }
  }

  // Return known token data or fetched data
  if (knownToken) {
    return {
      symbol: knownToken.symbol,
      name: knownToken.name,
      decimals: knownToken.decimals,
      isLoading: false,
    }
  }

  return {
    symbol: (symbol as string) || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
    name: (name as string) || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
    decimals: (decimals as number) || 18,
    isLoading,
  }
} 