'use client'

import { useReadContracts, useAccount, useWriteContract } from 'wagmi'
import { kandelLibABI } from '@/utils/abi/kandelLib'
import { kandelSeederABI } from '@/utils/abi/kandelSeeder'
import { parseUnits } from 'viem'
import { params_ggsp, Market, ValidateParamsResult } from '@/types/kandel'
import { useMemo } from 'react'
import { CONTRACTS } from '@/utils/config'
import { approveToken } from './useERC20'

// Modify parameters (section B in plan)
export const setStepSize = async (
  kandelAddress: `0x${string}`, 
  newStepSize: number,
  writeContract: any
) => {
  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'setStepSize',
    args: [BigInt(newStepSize)],
  })
}

export const setGasreq = async (
  kandelAddress: `0x${string}`, 
  newGasreq: number,
  writeContract: any
) => {
  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'setGasreq',
    args: [BigInt(newGasreq)],
  })
}

export const setGasprice = async (
  kandelAddress: `0x${string}`, 
  newGasprice: number,
  writeContract: any
) => {
  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'setGasprice',
    args: [BigInt(newGasprice)],
  })
}

export const setBaseQuoteTickOffset = async (
  kandelAddress: `0x${string}`, 
  newOffset: number,
  writeContract: any
) => {
  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'setBaseQuoteTickOffset',
    args: [BigInt(newOffset)],
  })
}

// Deposit / Withdraw funds (section A in plan)
// Step 1: Approve base token
export const approveBaseToken = async (
  baseAmount: string,
  kandelAddress: `0x${string}`,
  baseToken: `0x${string}`,
  baseDecimals: number,
  writeContract: any
) => {
  if (!baseAmount) return null
  const baseAmountParsed = parseUnits(baseAmount, baseDecimals)
  if (baseAmountParsed <= 0n) return null
  
  return approveToken(baseToken, kandelAddress, baseAmountParsed, writeContract)
}

// Step 2: Approve quote token
export const approveQuoteToken = async (
  quoteAmount: string,
  kandelAddress: `0x${string}`,
  quoteToken: `0x${string}`,
  quoteDecimals: number,
  writeContract: any
) => {
  if (!quoteAmount) return null
  const quoteAmountParsed = parseUnits(quoteAmount, quoteDecimals)
  if (quoteAmountParsed <= 0n) return null
  
  return approveToken(quoteToken, kandelAddress, quoteAmountParsed, writeContract)
}

// Step 3: Execute deposit
export const executeDeposit = async (
  baseAmount: string,
  quoteAmount: string,
  kandelAddress: `0x${string}`,
  baseDecimals: number,
  quoteDecimals: number,
  writeContract: any
) => {
  const baseAmountParsed = baseAmount ? parseUnits(baseAmount, baseDecimals) : 0n
  const quoteAmountParsed = quoteAmount ? parseUnits(quoteAmount, quoteDecimals) : 0n

  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'depositFunds',
    args: [baseAmountParsed, quoteAmountParsed],
  })
}

export const withdrawFunds = async (
  baseAmount: string, 
  quoteAmount: string,
  kandelAddress: `0x${string}`,
  baseDecimals: number,
  quoteDecimals: number,
  writeContract: any,
  userAddress: `0x${string}`
) => {
  if (!userAddress) throw new Error('Wallet not connected')

  const baseAmountParsed = baseAmount ? parseUnits(baseAmount, baseDecimals) : 0n
  const quoteAmountParsed = quoteAmount ? parseUnits(quoteAmount, quoteDecimals) : 0n

  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'withdrawFunds',
    args: [baseAmountParsed, quoteAmountParsed, userAddress],
  })
}

// Full Withdraw + De-register (section 5 in plan)
export const retractAndWithdraw = async (
  params: params_ggsp,
  kandelAddress: `0x${string}`,
  writeContract: any,
  userAddress: `0x${string}`
) => {
  if (!userAddress) throw new Error('Wallet not connected')
  if (!params) throw new Error('Kandel parameters not loaded')
  
  const maxint: bigint = 115792089237316195423570985008687907853269984665640564039457584007913129639935n
  
  // 2. Withdraw remaining inventory & accumulated provision in one go
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

// Kandel Position Creation Functions
export const deployKandel = async (
  selectedMarket: Market, 
  writeContract: any
) => {
  if (!selectedMarket) throw new Error('No market selected')

  return writeContract({
    address: CONTRACTS.KANDEL_SEEDER,
    abi: kandelSeederABI,
    functionName: 'sow',
    args: [
      {
        outbound_tkn: selectedMarket.tkn0,
        inbound_tkn: selectedMarket.tkn1,
        tickSpacing: selectedMarket.tickSpacing,
      },
      false, // liquiditySharing
    ],
  })
}

export const populateKandel = async (
  kandelAddress: `0x${string}`,
  finalValidationResult: ValidateParamsResult,
  globalConfig: any,
  writeContract: any
) => {
  if (!kandelAddress || !finalValidationResult || !globalConfig) {
    throw new Error('Missing required parameters for Kandel population')
  }

  return writeContract({
    address: kandelAddress,
    abi: kandelLibABI,
    functionName: 'populateFromOffset',
    args: [
      0n, // from
      finalValidationResult.params.pricePoints, // to
      finalValidationResult.params.baseQuoteTickIndex0,
      finalValidationResult.params.baseQuoteTickOffset,
      finalValidationResult.params.firstAskIndex,
      finalValidationResult.params.bidGives,
      finalValidationResult.params.askGives,
      {
        gasprice: Number(globalConfig.gasprice),
        gasreq: Number(finalValidationResult.params.gasreq),
        stepSize: Number(finalValidationResult.params.stepSize),
        pricePoints: Number(finalValidationResult.params.pricePoints),
      },
      finalValidationResult.rawParams.baseAmount,
      finalValidationResult.rawParams.quoteAmount,
    ],
    value: finalValidationResult.minProvision,
  })
}

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
        args: [0], // base token balance (asks)
      },
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'reserveBalance',
        args: [1], // quote token balance (bids)
      },
      // offeredVolume(0/1) → current live liquidity per side
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'offeredVolume',
        args: [0], // base token offered volume (asks)
      },
      {
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'offeredVolume',
        args: [1], // quote token offered volume (bids)
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
    // Contract interaction
    writeContract,
    txHash,
    isWritePending,
    userAddress,
  }
}