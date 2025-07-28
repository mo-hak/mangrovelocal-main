'use client'

import { useAccount, useWriteContract } from 'wagmi'
import { kandelSeederABI } from '@/utils/abi/kandelSeeder'
import { kandelLibABI } from '@/utils/abi/kandelLib'
import { parseUnits } from 'viem'
import { Market, ValidateParamsResult } from '@/types/kandel'
import { CONTRACTS } from '@/utils/config'
import { approveToken } from './useERC20'

export function useKandelPositionCreation() {
  const { address: userAddress } = useAccount()
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()

  // Deploy a new Kandel instance
  const deployKandel = async (selectedMarket: Market) => {
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

  // Approve tokens for the Kandel instance
  const approveTokenForKandel = async (
    tokenAddress: `0x${string}`,
    kandelAddress: `0x${string}`,
    amount: string,
    decimals: number
  ) => {
    const amountParsed = parseUnits(amount, decimals)
    return approveToken(tokenAddress, kandelAddress, amountParsed, writeContract)
  }

  // Populate the Kandel instance with offers
  const populateKandel = async (
    kandelAddress: `0x${string}`,
    finalValidationResult: ValidateParamsResult,
    globalConfig: any
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

  return {
    // State
    txHash,
    isWritePending,
    userAddress,
    // Methods
    deployKandel,
    approveTokenForKandel,
    populateKandel,
  }
}