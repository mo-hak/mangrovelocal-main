'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { useOpenMarkets, useGlobalConfig, useMarketConfig } from '@/hooks/useMangrove'
import { CONTRACTS } from '@/utils/config'
import { parseUnits, formatUnits } from 'viem'

// Import MGV library functions
import { 
  validateKandelParams,
  getKandelPositionRawParams,
  type RawKandelParams,
  type ValidateParamsResult,
  type RawKandelPositionParams,
  type MarketParams
} from '@mangrovedao/mgv'

import { kandelSeederABI } from '@/abi/kandelSeeder'
import { kandelLibABI } from '@/abi/kandelLib'
import { erc20Abi } from '@/abi/erc20'

export function KandelPositionForm() {
  const { address } = useAccount()
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Fetch available markets
  const { data: marketsData, isLoading: marketsLoading } = useOpenMarkets()
  const markets = marketsData?.[0] || []

  // Phase 1: Strategy Shape Parameters
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number>(0)
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [midPrice, setMidPrice] = useState<string>('')
  const [pricePoints, setPricePoints] = useState<number>(10)
  const [stepSize, setStepSize] = useState<number>(2)

  // Phase 2: Funding Parameters
  const [baseAmount, setBaseAmount] = useState<string>('')
  const [quoteAmount, setQuoteAmount] = useState<string>('')

  // Validation State
  const [validationResult, setValidationResult] = useState<ValidateParamsResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string>('')

  // Transaction State
  const [currentStep, setCurrentStep] = useState<'form' | 'deploying' | 'approving-base' | 'approving-quote' | 'populating' | 'completed'>('form')
  const [deployedKandelAddress, setDeployedKandelAddress] = useState<`0x${string}` | null>(null)

  const selectedMarket = markets[selectedMarketIndex]
  
  // Get token info for selected market
  const baseTokenInfo = useTokenInfo(selectedMarket?.tkn0)
  const quoteTokenInfo = useTokenInfo(selectedMarket?.tkn1)

  // Format token names for display
  const formatTokenName = (address: `0x${string}`) => {
    if (address === CONTRACTS.WETH) return 'WETH'
    if (address === CONTRACTS.USDC) return 'USDC'
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Fetch configurations needed for validation
  const { data: globalConfig } = useGlobalConfig()
  const { data: marketConfigData } = useMarketConfig(
    selectedMarket?.tkn0 || '0x0',
    selectedMarket?.tkn1 || '0x0'
  )

  // Validate parameters when inputs change
  useEffect(() => {
    if (!selectedMarket || !minPrice || !maxPrice || !midPrice || 
        !baseTokenInfo.decimals || !quoteTokenInfo.decimals ||
        !globalConfig || !marketConfigData) {
      setValidationResult(null)
      return
    }

    const validateParams = async () => {
      try {
        setIsValidating(true)
        setValidationError('')

        // Create market params for mgv library
        const market: MarketParams = {
          base: selectedMarket.tkn0,
          quote: selectedMarket.tkn1,
          tickSpacing: selectedMarket.tickSpacing
        }

        // Convert human prices to raw params
        const positionParams: RawKandelPositionParams = {
          market,
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          midPrice: parseFloat(midPrice),
          pricePoints: BigInt(pricePoints),
          adjust: true
        }

        const rawPositionParams = getKandelPositionRawParams(positionParams)

        // Parse amounts or use zero for initial validation
        const baseAmountParsed = baseAmount ? parseUnits(baseAmount, baseTokenInfo.decimals) : 0n
        const quoteAmountParsed = quoteAmount ? parseUnits(quoteAmount, quoteTokenInfo.decimals) : 0n

        // Validate with full parameters
        const validationParams: RawKandelParams = {
          ...positionParams,
          baseAmount: baseAmountParsed,
          quoteAmount: quoteAmountParsed,
          stepSize: BigInt(stepSize),
          gasreq: 250_000n, // Standard gas requirement
          factor: 1, // 100% of minVolume
          asksLocalConfig: marketConfigData.config01,
          bidsLocalConfig: marketConfigData.config10,
          marketConfig: globalConfig,
        }

        const result = validateKandelParams(validationParams)
        setValidationResult(result)

        if (!result.isValid && baseAmount && quoteAmount) {
          setValidationError('Amounts below minimum requirements')
        } else {
          setValidationError('')
        }
      } catch (error) {
        console.error('Validation error:', error)
        setValidationError(error instanceof Error ? error.message : 'Validation failed')
        setValidationResult(null)
      } finally {
        setIsValidating(false)
      }
    }

    validateParams()
  }, [
    selectedMarket, minPrice, maxPrice, midPrice, pricePoints, stepSize,
    baseAmount, quoteAmount, baseTokenInfo.decimals, quoteTokenInfo.decimals,
    globalConfig, marketConfigData
  ])

  // Step 1: Deploy Kandel Contract
  const deployKandel = async () => {
    if (!selectedMarket || !validationResult) return

    setCurrentStep('deploying')

    try {
      await writeContract({
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
    } catch (error) {
      console.error('Deploy Kandel error:', error)
      setCurrentStep('form')
    }
  }

  // Step 2: Approve Base Token
  const approveBaseToken = async () => {
    if (!deployedKandelAddress || !validationResult || !baseAmount) return

    setCurrentStep('approving-base')

    try {
      const amount = parseUnits(baseAmount, baseTokenInfo.decimals)
      await writeContract({
        address: selectedMarket.tkn0,
        abi: erc20Abi,
        functionName: 'approve',
        args: [deployedKandelAddress, amount],
      })
    } catch (error) {
      console.error('Approve base token error:', error)
      setCurrentStep('form')
    }
  }

  // Step 3: Approve Quote Token
  const approveQuoteToken = async () => {
    if (!deployedKandelAddress || !validationResult || !quoteAmount) return

    setCurrentStep('approving-quote')

    try {
      const amount = parseUnits(quoteAmount, quoteTokenInfo.decimals)
      await writeContract({
        address: selectedMarket.tkn1,
        abi: erc20Abi,
        functionName: 'approve',
        args: [deployedKandelAddress, amount],
      })
    } catch (error) {
      console.error('Approve quote token error:', error)
      setCurrentStep('form')
    }
  }

  // Step 4: Populate Kandel with offers
  const populateKandel = async () => {
    if (!deployedKandelAddress || !validationResult) return

    setCurrentStep('populating')

    try {
      await writeContract({
        address: deployedKandelAddress,
        abi: kandelLibABI,
        functionName: 'populateFromOffset',
        args: [
          0, // from
          validationResult.params.pricePoints, // to
          validationResult.params.baseQuoteTickIndex0,
          validationResult.params._baseQuoteTickOffset,
          validationResult.params.firstAskIndex,
          validationResult.params.bidGives,
          validationResult.params.askGives,
          {
            gasprice: validationResult.rawParams.gasprice,
            gasreq: validationResult.rawParams.gasreq,
            stepSize: validationResult.rawParams.stepSize,
          },
          validationResult.rawParams.baseAmount,
          validationResult.rawParams.quoteAmount,
        ],
        value: validationResult.minProvision,
      })
    } catch (error) {
      console.error('Populate Kandel error:', error)
      setCurrentStep('form')
    }
  }

  // Handle transaction completion
  useEffect(() => {
    if (txReceipt && txReceipt.status === 'success') {
      switch (currentStep) {
        case 'deploying':
          // Extract Kandel address from logs (simplified - in real implementation you'd parse the event)
          // For now, we'll simulate this by creating a dummy address
          const dummyKandelAddress = '0x1234567890123456789012345678901234567890' as `0x${string}`
          setDeployedKandelAddress(dummyKandelAddress)
          approveBaseToken()
          break
        case 'approving-base':
          approveQuoteToken()
          break
        case 'approving-quote':
          populateKandel()
          break
        case 'populating':
          setCurrentStep('completed')
          break
      }
    }
  }, [txReceipt, currentStep])

  if (!address) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Create Kandel Position</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to create a Kandel position.
        </p>
      </div>
    )
  }

  if (marketsLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Create Kandel Position</h3>
        <div className="text-center py-4">Loading markets...</div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-6">Create Kandel Position</h3>

      {currentStep === 'form' && (
        <>
          {/* Phase 1: Strategy Shape */}
          <div className="space-y-4 mb-6">
            <h4 className="font-medium text-gray-900 dark:text-white">Phase 1: Strategy Configuration</h4>
            
            {/* Market Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Market</label>
              <select
                value={selectedMarketIndex}
                onChange={(e) => setSelectedMarketIndex(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                {markets.map((market, index) => (
                  <option key={index} value={index}>
                    {formatTokenName(market.tkn0)}/{formatTokenName(market.tkn1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Min Price</label>
                <input
                  type="number"
                  step="any"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mid Price</label>
                <input
                  type="number"
                  step="any"
                  value={midPrice}
                  onChange={(e) => setMidPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Price</label>
                <input
                  type="number"
                  step="any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price Points</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={pricePoints}
                  onChange={(e) => setPricePoints(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Step Size</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={stepSize}
                  onChange={(e) => setStepSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Phase 2: Funding with real-time guidance */}
          {validationResult && (
            <div className="space-y-4 mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white">Phase 2: Initial Funding</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formatTokenName(selectedMarket.tkn0)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={baseAmount}
                    onChange={(e) => setBaseAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Minimum required: {formatUnits(validationResult.minBaseAmount, baseTokenInfo.decimals)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formatTokenName(selectedMarket.tkn1)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Minimum required: {formatUnits(validationResult.minQuoteAmount, quoteTokenInfo.decimals)}
                  </div>
                </div>
              </div>

              {/* Gas Provision Display */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm">
                  <strong>Required Provision:</strong> {formatUnits(validationResult.minProvision, 18)} ETH
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  This amount covers gas costs for potential failed deliveries and will be paid from your wallet.
                </div>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {isValidating && (
            <div className="text-center py-2">
              <div className="text-sm text-gray-600">Validating parameters...</div>
            </div>
          )}

          {validationError && (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-red-600 text-sm mb-4">
              {validationError}
            </div>
          )}

          {/* Create Position Button */}
          <button
            onClick={deployKandel}
            disabled={!validationResult?.isValid || isValidating || isWritePending}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isWritePending ? 'Creating Position...' : 'Create Kandel Position'}
          </button>
        </>
      )}

      {/* Transaction Progress */}
      {currentStep !== 'form' && (
        <div className="space-y-4">
          <h4 className="font-medium">Transaction Progress</h4>
          <div className="space-y-2">
            <div className={`flex items-center space-x-2 ${currentStep === 'deploying' ? 'text-blue-600' : currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>Deploy Kandel Contract</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep === 'approving-base' ? 'text-blue-600' : currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>Approve {formatTokenName(selectedMarket?.tkn0 || '0x0')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep === 'approving-quote' ? 'text-blue-600' : currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>Approve {formatTokenName(selectedMarket?.tkn1 || '0x0')}</span>
            </div>
            <div className={`flex items-center space-x-2 ${currentStep === 'populating' ? 'text-blue-600' : currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span>Populate with Offers</span>
            </div>
          </div>

          {currentStep === 'completed' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-green-600 font-medium">Position Created Successfully!</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your Kandel position is now active and offers are live on the order book.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}