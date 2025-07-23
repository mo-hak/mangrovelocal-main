'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { useOpenMarkets, useGlobalConfig, useMarketConfig } from '@/hooks/useMangrove'
import { CONTRACTS } from '@/utils/config'
import { parseUnits, formatUnits, decodeEventLog } from 'viem'

// Import MGV library functions
import { 
  validateKandelParams,
  type RawKandelParams,
  type ValidateParamsResult,
  type RawKandelPositionParams,
  type MarketParams,
  type Token
} from '@mangrovedao/mgv'

import { kandelSeederABI } from '@/abi/kandelSeeder'
import { kandelLibABI } from '@/abi/kandelLib'
import { erc20Abi } from '@/abi/erc20'

export function KandelPositionForm() {
  const { address } = useAccount()
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })
  
  // Handle hydration mismatch
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

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

  // Phase 2: Funding Parameters (only shown after Phase 1 validation)
  const [baseAmount, setBaseAmount] = useState<string>('')
  const [quoteAmount, setQuoteAmount] = useState<string>('')

  // Validation State
  const [phase1ValidationResult, setPhase1ValidationResult] = useState<ValidateParamsResult | null>(null)
  const [finalValidationResult, setFinalValidationResult] = useState<ValidateParamsResult | null>(null)
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

  // Phase 1 validation: Get minimums with mock amounts (per Position_Creation_doc.md)
  useEffect(() => {
    // Only validate Phase 1 if all required data is available and we have prices
    if (!selectedMarket || !baseTokenInfo.decimals || !quoteTokenInfo.decimals ||
        !globalConfig || !marketConfigData || 
        !baseTokenInfo.symbol || !quoteTokenInfo.symbol ||
        baseTokenInfo.symbol === 'UNKNOWN' || quoteTokenInfo.symbol === 'UNKNOWN') {
      setPhase1ValidationResult(null)
      return
    }

    // Skip validation if Phase 1 prices are not filled yet
    if (!minPrice || !maxPrice || !midPrice) {
      setPhase1ValidationResult(null)
      return
    }

    // Check for valid numbers
    const minPriceNum = parseFloat(minPrice)
    const maxPriceNum = parseFloat(maxPrice)
    const midPriceNum = parseFloat(midPrice)

    if (isNaN(minPriceNum) || isNaN(maxPriceNum) || isNaN(midPriceNum)) {
      setValidationError('Please enter valid numbers for price fields')
      setPhase1ValidationResult(null)
      return
    }

    // Check price range logic
    if (minPriceNum <= 0 || maxPriceNum <= 0 || midPriceNum <= 0) {
      setValidationError('All prices must be greater than 0')
      setPhase1ValidationResult(null)
      return
    }

    if (minPriceNum >= maxPriceNum) {
      setValidationError('Min price must be less than max price')
      setPhase1ValidationResult(null)
      return
    }

    if (midPriceNum < minPriceNum || midPriceNum > maxPriceNum) {
      setValidationError('Mid price must be between min and max price')
      setPhase1ValidationResult(null)
      return
    }

    const validatePhase1 = async () => {
      // Create market params for mgv library with proper Token objects
      const baseToken: Token = {
        address: selectedMarket.tkn0,
        symbol: baseTokenInfo.symbol,
        decimals: baseTokenInfo.decimals,
        displayDecimals: Math.min(baseTokenInfo.decimals, 4),
        priceDisplayDecimals: 4,
        mgvTestToken: true
      }

      const quoteToken: Token = {
        address: selectedMarket.tkn1,
        symbol: quoteTokenInfo.symbol,
        decimals: quoteTokenInfo.decimals,
        displayDecimals: Math.min(quoteTokenInfo.decimals, 4),
        priceDisplayDecimals: 2,
        mgvTestToken: true
      }

      const market: MarketParams = {
        base: baseToken,
        quote: quoteToken,
        tickSpacing: selectedMarket.tickSpacing
      }

      try {
        setIsValidating(true)
        setValidationError('')

        // Phase 1: Call validateKandelParams with mock amounts to get minimums
        // As per Position_Creation_doc.md: "using placeholder values for the inventory (e.g., baseAmount: 0n, quoteAmount: 0n)"
        const positionParams: RawKandelPositionParams = {
          market,
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          midPrice: parseFloat(midPrice),
          pricePoints: Number(pricePoints),
          adjust: true
        } as any

        // Phase 1 validation with mock amounts to get minimums
        const phase1ValidationParams: RawKandelParams = {
          ...positionParams,
          baseAmount: 0n, // Mock amount as per doc
          quoteAmount: 0n, // Mock amount as per doc 
          stepSize: Number(stepSize), // Helper library needs Number
          gasreq: 250000, // Helper library needs Number
          factor: 1, // 100% of minVolume
          asksLocalConfig: marketConfigData?.config01 as any,
          bidsLocalConfig: marketConfigData?.config10 as any,
          marketConfig: globalConfig!,
        } as any

                  const result = validateKandelParams(phase1ValidationParams)
        setPhase1ValidationResult(result)
        setValidationError('')
      } catch (error) {
        console.error('Phase 1 validation error:', error)
        
        let errorMessage = 'Validation failed'
        if (error instanceof Error) {
          console.error('Error message:', error.message)
          if (error.message.includes('NaN')) {
            errorMessage = 'Please enter valid numbers for all price fields'
          } else {
            errorMessage = error.message
          }
        }
        setValidationError(errorMessage)
        setPhase1ValidationResult(null)
      } finally {
        setIsValidating(false)
      }
    }

    validatePhase1()
  }, [
    selectedMarket, minPrice, maxPrice, midPrice, pricePoints, stepSize,
    baseTokenInfo.decimals, quoteTokenInfo.decimals, baseTokenInfo.symbol, quoteTokenInfo.symbol,
    globalConfig, marketConfigData
  ])

  // Phase 2 validation: Validate with actual user amounts
  useEffect(() => {
    // Only run Phase 2 validation if we have a Phase 1 result and user has entered amounts
    if (!phase1ValidationResult || !baseAmount || !quoteAmount) {
      setFinalValidationResult(phase1ValidationResult)
      return
    }

    // Check for valid amounts
    const baseAmountNum = parseFloat(baseAmount)
    const quoteAmountNum = parseFloat(quoteAmount)

    if (isNaN(baseAmountNum) || isNaN(quoteAmountNum) || baseAmountNum <= 0 || quoteAmountNum <= 0) {
      setValidationError('Please enter valid amounts')
      setFinalValidationResult(null)
      return
    }

    const validatePhase2 = async () => {
      try {
        setIsValidating(true)
        
        // Parse user amounts
        let baseAmountParsed: bigint
        let quoteAmountParsed: bigint

        try {
          baseAmountParsed = parseUnits(baseAmount as `${number}`, baseTokenInfo.decimals)
        } catch (error) {
          console.error('Error parsing base amount:', error)
          setValidationError('Invalid base token amount')
          return
        }

        try {
          quoteAmountParsed = parseUnits(quoteAmount as `${number}`, quoteTokenInfo.decimals)
        } catch (error) {
          console.error('Error parsing quote amount:', error)
          setValidationError('Invalid quote token amount')
          return
        }

        // Create Token objects
        const baseToken: Token = {
          address: selectedMarket.tkn0,
          symbol: baseTokenInfo.symbol,
          decimals: baseTokenInfo.decimals,
          displayDecimals: Math.min(baseTokenInfo.decimals, 4),
          priceDisplayDecimals: 4,
          mgvTestToken: true
        }

        const quoteToken: Token = {
          address: selectedMarket.tkn1,
          symbol: quoteTokenInfo.symbol,
          decimals: quoteTokenInfo.decimals,
          displayDecimals: Math.min(quoteTokenInfo.decimals, 4),
          priceDisplayDecimals: 2,
          mgvTestToken: true
        }

        const market: MarketParams = {
          base: baseToken,
          quote: quoteToken,
          tickSpacing: selectedMarket.tickSpacing
        }

        // Phase 2 validation with actual user amounts
        const phase2ValidationParams: RawKandelParams = {
          market,
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          midPrice: parseFloat(midPrice),
          pricePoints: Number(pricePoints),
          adjust: true,
          baseAmount: baseAmountParsed,
          quoteAmount: quoteAmountParsed,
          stepSize: Number(stepSize),
          gasreq: 250_000,
          factor: 1,
          asksLocalConfig: marketConfigData?.config01 as any,
          bidsLocalConfig: marketConfigData?.config10 as any,
          marketConfig: globalConfig!,
        } as any

                  const result = validateKandelParams(phase2ValidationParams)
        setFinalValidationResult(result)

        if (!result.isValid) {
          setValidationError('Amounts below minimum requirements')
        } else {
          setValidationError('')
        }
      } catch (error) {
        console.error('Phase 2 validation error:', error)
        setValidationError('Validation failed with entered amounts')
        setFinalValidationResult(null)
      } finally {
        setIsValidating(false)
      }
    }

    validatePhase2()
  }, [phase1ValidationResult, baseAmount, quoteAmount, selectedMarket, minPrice, maxPrice, midPrice, pricePoints, stepSize, baseTokenInfo.decimals, quoteTokenInfo.decimals, baseTokenInfo.symbol, quoteTokenInfo.symbol, globalConfig, marketConfigData])

  // Step 1: Deploy Kandel Contract
  const deployKandel = async () => {
    if (!selectedMarket || !finalValidationResult) return

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
    if (!deployedKandelAddress || !finalValidationResult || !baseAmount) return

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
    if (!deployedKandelAddress || !finalValidationResult || !quoteAmount) return

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
    if (!deployedKandelAddress || !finalValidationResult) return

    setCurrentStep('populating')

    try {
      await (writeContract as any)({
        address: deployedKandelAddress,
        abi: kandelLibABI,
        functionName: 'populateFromOffset',
        args: [
          BigInt(0), // from
          BigInt(finalValidationResult.params.pricePoints), // to
          finalValidationResult.params.baseQuoteTickIndex0,
          finalValidationResult.params.baseQuoteTickOffset,
          finalValidationResult.params.firstAskIndex,
          finalValidationResult.params.bidGives,
          finalValidationResult.params.askGives,
          {
            gasprice: BigInt(250000), // now a uint256
            gasreq: BigInt(finalValidationResult.rawParams.gasreq),
            stepSize: BigInt(finalValidationResult.rawParams.stepSize),
          },
          finalValidationResult.rawParams.baseAmount,
          finalValidationResult.rawParams.quoteAmount,
        ],
        value: finalValidationResult.minProvision,
      })
    } catch (error) {
      console.error('Populate Kandel error:', error)
      setCurrentStep('form')
    }
  }

  // Handle transaction completion
  useEffect(() => {
    if (txReceipt) {
      if (txReceipt.status === 'reverted') {
        setValidationError('Transaction failed. Please try again.')
        setCurrentStep('form')
        return
      }
      
      if (txReceipt.status === 'success') {
      switch (currentStep) {
        case 'deploying':
          // Extract Kandel address from NewKandel event
          try {
            // Parse NewKandel event from transaction logs
            const newKandelEvent = txReceipt.logs.find(
              (log) => {
                try {
                  const decoded = decodeEventLog({
                    abi: kandelSeederABI,
                    data: log.data,
                    topics: log.topics,
                  })
                  return decoded.eventName === 'NewKandel'
                } catch {
                  return false
                }
              }
            )
            
            if (newKandelEvent) {
              const decoded = decodeEventLog({
                abi: kandelSeederABI,
                data: newKandelEvent.data,
                topics: newKandelEvent.topics,
              })
              const kandelAddress = (decoded.args as any).kandel as `0x${string}`
              setDeployedKandelAddress(kandelAddress)
            } else {
              throw new Error('NewKandel event not found in transaction logs')
            }
          } catch (error) {
            console.error('Failed to extract Kandel address:', error)
            setValidationError('Failed to extract Kandel address from transaction')
            setCurrentStep('form')
            return
          }
          setTimeout(() => approveBaseToken(), 1000) // Add small delay for reliability
          break
        case 'approving-base':
          setTimeout(() => approveQuoteToken(), 1000)
          break
        case 'approving-quote':
          setTimeout(() => populateKandel(), 1000)
          break
        case 'populating':
          setCurrentStep('completed')
          break
      }
    }
  }}, [txReceipt, currentStep])
  
  // Reset form and errors when starting over
  const resetForm = () => {
    setCurrentStep('form')
    setDeployedKandelAddress(null)
    setValidationError('')
    setMinPrice('')
    setMaxPrice('')
    setMidPrice('')
    setPricePoints(10)
    setStepSize(2)
    setBaseAmount('')
    setQuoteAmount('')
    setPhase1ValidationResult(null)
    setFinalValidationResult(null)
  }

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

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
                  min="0"
                  value={minPrice}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setMinPrice(value)
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="1500"
                />
                <div className="text-xs text-gray-500 mt-1">Lower bound of price range</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mid Price</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={midPrice}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setMidPrice(value)
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="2000"
                />
                <div className="text-xs text-gray-500 mt-1">Current market price</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Price</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setMaxPrice(value)
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="2500"
                />
                <div className="text-xs text-gray-500 mt-1">Upper bound of price range</div>
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

          {/* Phase 2: Funding (only shown after Phase 1 validation) */}
          {phase1ValidationResult && (
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
                    min="0"
                    value={baseAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setBaseAmount(value)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Minimum required: {phase1ValidationResult.minBaseAmount ? formatUnits(phase1ValidationResult.minBaseAmount, baseTokenInfo.decimals) : '0'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formatTokenName(selectedMarket.tkn1)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={quoteAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setQuoteAmount(value)
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="100"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Minimum required: {phase1ValidationResult.minQuoteAmount ? formatUnits(phase1ValidationResult.minQuoteAmount, quoteTokenInfo.decimals) : '0'}
                  </div>
                </div>
              </div>

              {/* Gas Provision Display */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm">
                  <strong>Required Provision:</strong> {phase1ValidationResult.minProvision ? formatUnits(phase1ValidationResult.minProvision, 18) : '0'} ETH
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
            disabled={!finalValidationResult?.isValid || isValidating || isWritePending}
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