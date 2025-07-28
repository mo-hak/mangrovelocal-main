'use client'

import { useReadContract, useWriteContract, useAccount } from 'wagmi'
import { erc20Abi } from '@/utils/abi/erc20'

export function useTokenBalance(tokenAddress: `0x${string}`) {
  const { address } = useAccount()
  
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && tokenAddress),
    },
  })
}

export function useTokenAllowance(tokenAddress: `0x${string}`, spender: `0x${string}`) {
  const { address } = useAccount()
  
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
    query: {
      enabled: Boolean(address && tokenAddress && spender),
    },
  })
}

export const approveToken = async(Token: `0x${string}`, Address: `0x${string}`, AmountParsed: bigint, writeContract: any)=> {
  if (AmountParsed > 0n) {
    return await writeContract({
      address: Token,
      abi: erc20Abi,
      functionName: 'approve',
      args: [Address, AmountParsed],
    })
  }
}

export function useMintToken() {
  return useWriteContract()
}