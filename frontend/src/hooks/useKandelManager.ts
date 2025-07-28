'use client'

import { useReadContracts, useAccount, useWriteContract } from 'wagmi'
import { kandelLibABI } from '@/utils/abi/kandelLib'
import { parseUnits } from 'viem'
import { params_ggsp } from '@/types/kandel'
import { useMemo } from 'react'
import { approveToken } from './useERC20'

export function useKandelManager(kandelAddress: `0x${string}`) {
  const { address: userAddress } = useAccount()
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()

  // Multicall to fetch all Kandel instance state efficiently (as per plan)
  const { data: kandelData, isLoading, error, refetch } = useReadContracts({
    contracts: [
      // Read-only functions as specified in plan:
      // params() → gasprice, gasreq, stepSize, pricePoints
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'params',
      },
      // baseQuoteTickOffset() → rebuild min/max price range
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'baseQuoteTickOffset',
      },
      // reserveBalance(0/1) → current free balance per side
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'reserveBalance',
        args: [0], // bid token balance (asks)
      },
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'reserveBalance',
        args: [1], // ask token balance (bids)
      },
      // offeredVolume(0/1) → current live liquidity per side
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'offeredVolume',
        args: [0], // bid token offered volume (asks)
      },
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'offeredVolume',
        args: [1], // ask token offered volume (bids)
      },
    ],
    query: {
      enabled: Boolean(kandelAddress),
    },
  })

  // Extract data from multicall results
  const params = useMemo((): params_ggsp => {
    const paramsResult = kandelData?.[0];
    if (paramsResult?.status === 'success' && Array.isArray(paramsResult.result)) {
      return {
        gasprice: paramsResult.result[0],
        gasreq: paramsResult.result[1],
        stepSize: paramsResult.result[2],
        pricePoints: paramsResult.result[3],
      };
    }
    return {
      gasprice: 0,
      gasreq: 0,
      stepSize: 0,
      pricePoints: 0,
    };
  }, [kandelData]);

  const baseQuoteTickOffset = kandelData?.[1]?.result as bigint
  const baseReserveBalance = kandelData?.[3]?.result as bigint 
  const quoteReserveBalance = kandelData?.[2]?.result as bigint  
  const baseOfferedVolume = kandelData?.[5]?.result as bigint    
  const quoteOfferedVolume = kandelData?.[4]?.result as bigint

  
  const setStepSize = async (newStepSize: number) => {
    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'setStepSize',
      args: [BigInt(newStepSize)],
    })
  }

  const setGasreq = async (newGasreq: number) => {
    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'setGasreq',
      args: [BigInt(newGasreq)],
    })
  }

  const setGasprice = async (newGasprice: number) => {
    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'setGasprice',
      args: [BigInt(newGasprice)],
    })
  }

  const approveBaseToken = async (baseAmount: string, baseToken: `0x${string}`, baseDecimals: number) => {
    if (!baseAmount) return null
    const baseAmountParsed = parseUnits(baseAmount, baseDecimals)
    if (baseAmountParsed <= 0n) return null
    
    return approveToken(baseToken, kandelAddress, baseAmountParsed, writeContract)
  }

  const approveQuoteToken = async (quoteAmount: string, quoteToken: `0x${string}`, quoteDecimals: number) => {
    if (!quoteAmount) return null
    const quoteAmountParsed = parseUnits(quoteAmount, quoteDecimals)
    if (quoteAmountParsed <= 0n) return null
    
    return approveToken(quoteToken, kandelAddress, quoteAmountParsed, writeContract)
  }

  const executeDeposit = async (baseAmount: string, quoteAmount: string, baseDecimals: number, quoteDecimals: number) => {
    const baseAmountParsed = baseAmount ? parseUnits(baseAmount, baseDecimals) : 0n
    const quoteAmountParsed = quoteAmount ? parseUnits(quoteAmount, quoteDecimals) : 0n

    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'depositFunds',
      args: [baseAmountParsed, quoteAmountParsed],
    })
  }

  const withdrawFunds = async (baseAmount: string, quoteAmount: string, baseDecimals: number, quoteDecimals: number) => {
    if (!userAddress) throw new Error('User not connected')
    
    const baseAmountParsed = baseAmount ? parseUnits(baseAmount, baseDecimals) : 0n
    const quoteAmountParsed = quoteAmount ? parseUnits(quoteAmount, quoteDecimals) : 0n

    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'withdrawFunds',
      args: [baseAmountParsed, quoteAmountParsed, userAddress],
    })
  }

  const retractAndWithdraw = async () => {
    if (!userAddress) throw new Error('User not connected')
    
    const maxint = 2n ** 256n - 1n
    
    return writeContract({
      address: kandelAddress,
      abi: kandelLibABI,
      functionName: 'retractAndWithdraw',
      args: [
        0n, // from
        BigInt(params.pricePoints), // to
        maxint, // MAX_UINT baseAmount
        maxint, // MAX_UINT quoteAmount
        maxint, // freeWei
        userAddress, // recipient
      ],
    })
  }

  return {
    // Data (read-only as per plan)
    params,
    baseQuoteTickOffset,
    baseReserveBalance,
    quoteReserveBalance,
    baseOfferedVolume,
    quoteOfferedVolume,
    // Hook state
    isLoading,
    error,
    refetch,
    txHash,
    isWritePending,
    userAddress,
    // Hook methods
    setStepSize,
    setGasreq,
    setGasprice,
    approveBaseToken,
    approveQuoteToken,
    executeDeposit,
    withdrawFunds,
    retractAndWithdraw,
  }
}