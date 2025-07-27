'use client'

import { useAccount, usePublicClient } from 'wagmi'
import { useState, useEffect } from 'react'
import { CONTRACTS } from '@/utils/config'
import { kandelSeederABI } from '@/utils/abi/kandelSeeder'
import { decodeEventLog } from 'viem'
import { UserKandelPosition } from '@/types/kandel'

export function useUserPositions() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [positions, setPositions] = useState<UserKandelPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const formatTokenName = (address: `0x${string}`) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  useEffect(() => {
    const fetchUserPositions = async () => {
      if (!address || !publicClient) {
        setPositions([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Get the current block number
        const currentBlock = await publicClient.getBlockNumber()
        
        // Look back 10000 blocks
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n

        // Fetch NewKandel events from KandelSeeder
        const logs = await publicClient.getLogs({
          address: CONTRACTS.KANDEL_SEEDER,
          event: {
            type: 'event',
            name: 'NewKandel',
            inputs: [
              { name: 'owner', type: 'address', indexed: true },
              { name: 'olKeyHash', type: 'bytes32', indexed: true },
              { name: 'reverseOlKeyHash', type: 'bytes32', indexed: true },
              { name: 'kandel', type: 'address', indexed: false },
            ],
          },
          args: {
            owner: address, // Filter by user address
          },
          fromBlock,
          toBlock: 'latest',
        })

        const userPositions: UserKandelPosition[] = []

        for (const log of logs) {
          try {
            const decoded = decodeEventLog({
              abi: kandelSeederABI,
              data: log.data,
              topics: log.topics,
            })

            if (decoded.eventName === 'NewKandel') {
              const args = decoded.args as any
              const kandelAddress = args.kandel as `0x${string}`
              
              // Fetch BASE and QUOTE token addresses from the Kandel contract
              try {
                const [baseToken, quoteToken] = await Promise.all([
                  publicClient.readContract({
                    address: kandelAddress,
                    abi: [
                      {
                        name: 'BASE',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [],
                        outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
                      },
                    ],
                    functionName: 'BASE',
                  }),
                  publicClient.readContract({
                    address: kandelAddress,
                    abi: [
                      {
                        name: 'QUOTE',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [],
                        outputs: [{ name: '', type: 'address', internalType: 'contract IERC20' }],
                      },
                    ],
                    functionName: 'QUOTE',
                  }),
                ])
                
                userPositions.push({
                  address: kandelAddress,
                  baseToken: baseToken as `0x${string}`,
                  quoteToken: quoteToken as `0x${string}`,
                  market: `${formatTokenName(baseToken as `0x${string}`)}/${formatTokenName(quoteToken as `0x${string}`)}`,
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                })
              } catch (contractError) {
                // Skip this position if we can't get the token addresses
                continue
              }
            }
          } catch (decodeError) {
            // Skip this log if we can't decode it
            continue
          }
        }

        // Sort by block number (newest first)
        userPositions.sort((a, b) => Number(b.blockNumber - a.blockNumber))
        
        setPositions(userPositions)
      } catch (err) {
        setError('Failed to fetch positions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserPositions()
  }, [address, publicClient, refetchTrigger])

  return {
    positions,
    isLoading,
    error,
    refetch: () => setRefetchTrigger(prev => prev + 1),
  }
}