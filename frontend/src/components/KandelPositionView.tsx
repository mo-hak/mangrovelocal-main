'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { formatUnits } from 'viem'
import { useKandelManager, setStepSize, setGasreq, setGasprice, depositFunds, withdrawFunds, retractAndWithdraw } from '@/hooks/useKandelManager'
import { useTokenInfo } from '@/hooks/useTokenInfo'

interface KandelPositionViewProps {
  kandelAddress: `0x${string}`
  baseToken: `0x${string}`
  quoteToken: `0x${string}`
  onClose: () => void
}

export function KandelPositionView({ 
  kandelAddress, 
  baseToken, 
  quoteToken, 
  onClose 
}: KandelPositionViewProps) {
  const { address } = useAccount()
  const baseTokenInfo = useTokenInfo(baseToken)
  const quoteTokenInfo = useTokenInfo(quoteToken)
  
  // Use writeContract hook for transactions
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  
  // Use the useKandelManager hook for data fetching and contract interaction
  const {
    params,
    baseReserveBalance,
    quoteReserveBalance,
    baseOfferedVolume,
    quoteOfferedVolume,
    isLoading,
    error,
    refetch,
    userAddress,
  } = useKandelManager(kandelAddress)

  // Transaction state
  const [currentAction, setCurrentAction] = useState<'none' | 'updating-step' | 'updating-gasreq' | 'updating-gasprice' | 'depositing' | 'withdrawing' | 'full-withdraw'>('none')

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editStepSize, setEditStepSize] = useState<string>('')
  const [editGasreq, setEditGasreq] = useState<string>('')
  const [editGasprice, setEditGasprice] = useState<string>('')

  // Deposit/Withdraw states
  const [depositBaseAmount, setDepositBaseAmount] = useState<string>('')
  const [depositQuoteAmount, setDepositQuoteAmount] = useState<string>('')
  const [withdrawBaseAmount, setWithdrawBaseAmount] = useState<string>('')
  const [withdrawQuoteAmount, setWithdrawQuoteAmount] = useState<string>('')

  // Format token names for display
  const formatTokenName = (address: `0x${string}`, symbol?: string) => {
    return symbol || `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Initialize edit values when entering edit mode
  useEffect(() => {
    if (isEditMode && params) {
      setEditStepSize(params.stepSize?.toString() || '')
      setEditGasreq(params.gasreq?.toString() || '')
      setEditGasprice(params.gasprice?.toString() || '')
    }
  }, [isEditMode, params])

  // Update step size using exported function
  const updateStepSize = async () => {
    if (!params || !editStepSize) return

    const newStepSize = Number(editStepSize)
      if (!Number.isFinite(newStepSize) || newStepSize <= 0) {
      alert('Invalid step size')
        return
      }

      try {
        setCurrentAction('updating-step')
        await setStepSize(kandelAddress, newStepSize, writeContract)
      } catch (error) {
        console.error('Error updating step size:', error)
        setCurrentAction('none')
      }
  }

  // Update gas requirement using exported function
  const updateGasreq = async () => {
    if (!params || !editGasreq) return

    const newGasreq = Number(editGasreq)
    if (!Number.isFinite(newGasreq) || newGasreq <= 0) {
      alert('Invalid gas requirement')
        return
      }
      try {
        setCurrentAction('updating-gasreq')
        await setGasreq(kandelAddress, newGasreq, writeContract)
      } catch (error) {
        console.error('Error updating gas requirement:', error)
        setCurrentAction('none')
      }
    }

  // Update gas price using exported function
  const updateGasprice = async () => {
    if (!params || !editGasprice) return

    const newGasprice = Number(editGasprice)
    if (!Number.isFinite(newGasprice) || newGasprice <= 0) {
      alert('Invalid gas price')
      return
    }
      try {
        setCurrentAction('updating-gasprice')
        await setGasprice(kandelAddress, newGasprice, writeContract)
      } catch (error) {
        console.error('Error updating gas price:', error)
        setCurrentAction('none')
      }
      }

  // Handle deposit using exported function
  const handleDeposit = async () => {
    if (!depositBaseAmount && !depositQuoteAmount) return

    try {
      setCurrentAction('depositing')
      await depositFunds(
        depositBaseAmount, 
        depositQuoteAmount, 
        kandelAddress, 
        baseToken, 
        quoteToken, 
        baseTokenInfo.decimals, 
        quoteTokenInfo.decimals, 
        writeContract, 
        userAddress!
      )
      // Clear inputs after successful submission
      setDepositBaseAmount('')
      setDepositQuoteAmount('')
    } catch (error) {
      console.error('Error depositing funds:', error)
      setCurrentAction('none')
    }
  }

  // Handle withdraw using exported function
  const handleWithdraw = async () => {
    if (!withdrawBaseAmount && !withdrawQuoteAmount) return

    try {
    setCurrentAction('withdrawing')
      await withdrawFunds(
        withdrawBaseAmount, 
        withdrawQuoteAmount, 
        kandelAddress, 
        baseTokenInfo.decimals, 
        quoteTokenInfo.decimals, 
        writeContract, 
        userAddress!
      )
      // Clear inputs after successful submission
      setWithdrawBaseAmount('')
      setWithdrawQuoteAmount('')
    } catch (error) {
      console.error('Error withdrawing funds:', error)
      setCurrentAction('none')
    }
  }

  // Handle full withdraw using exported function
  const handleFullWithdraw = async () => {
    try {
    setCurrentAction('full-withdraw')
      await retractAndWithdraw(params, kandelAddress, writeContract, userAddress!)
    } catch (error) {
      console.error('Error performing full withdraw:', error)
      setCurrentAction('none')
    }
  }

  // Monitor transaction completion
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txReceipt && txReceipt.status === 'success') {
      setCurrentAction('none')
      setIsEditMode(false)
      refetch() // Refresh data after successful transaction
    } else if (txReceipt && txReceipt.status === 'reverted') {
      setCurrentAction('none')
      alert('Transaction failed')
    }
  }, [txReceipt, refetch])

  if (isLoading) {
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

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="text-red-600 dark:text-red-400">
          Error loading position: {error.message || 'Unknown error'}
        </div>
          <button
            onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
          Back to Positions
          </button>
      </div>
    )
  }

  if (!params) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="text-gray-600 dark:text-gray-400">
          Position data not available
        </div>
          <button
            onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
          Back to Positions
          </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Kandel Position: {formatTokenName(baseToken, baseTokenInfo.symbol)}/{formatTokenName(quoteToken, quoteTokenInfo.symbol)}
          </h3>
        <button
          onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
            Back to Positions
        </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
          Address: {kandelAddress}
        </div>
      </div>

      {/* Position Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h4 className="text-lg font-semibold mb-4">Position Overview</h4>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Reserve Balances */}
            <div>
            <h5 className="font-medium mb-2">Reserve Balances</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{formatTokenName(baseToken, baseTokenInfo.symbol)}:</span>
                <span className="font-mono">
                  {baseReserveBalance !== undefined 
                    ? formatUnits(baseReserveBalance, baseTokenInfo.decimals)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>{formatTokenName(quoteToken, quoteTokenInfo.symbol)}:</span>
                <span className="font-mono">
                  {quoteReserveBalance !== undefined 
                    ? formatUnits(quoteReserveBalance, quoteTokenInfo.decimals)
                    : '0'
                  }
                </span>
            </div>
          </div>
        </div>

          {/* Offered Volumes */}
            <div>
            <h5 className="font-medium mb-2">Offered Volumes</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{formatTokenName(baseToken, baseTokenInfo.symbol)}:</span>
                <span className="font-mono">
                  {baseOfferedVolume !== undefined 
                    ? formatUnits(baseOfferedVolume, baseTokenInfo.decimals)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>{formatTokenName(quoteToken, quoteTokenInfo.symbol)}:</span>
                <span className="font-mono">
                  {quoteOfferedVolume !== undefined 
                    ? formatUnits(quoteOfferedVolume, quoteTokenInfo.decimals)
                    : '0'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold">Parameters</h4>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={currentAction !== 'none'}
          >
            {isEditMode ? 'Cancel Edit' : 'Edit Parameters'}
          </button>
        </div>

        {isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                <label className="block text-sm font-medium mb-2">Step Size</label>
                  <input
                    type="number"
                    value={editStepSize}
                    onChange={(e) => setEditStepSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                <button
                  onClick={updateStepSize}
                  disabled={currentAction !== 'none' || BigInt(editStepSize || '0') === BigInt(params.stepSize)}
                  className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {currentAction === 'updating-step' ? 'Updating...' : 'Update Step Size'}
                </button>
                </div>
                <div>
                <label className="block text-sm font-medium mb-2">Gas Requirement</label>
                  <input
                    type="number"
                    value={editGasreq}
                    onChange={(e) => setEditGasreq(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                <button
                  onClick={updateGasreq}
                  disabled={currentAction !== 'none' || BigInt(editGasreq || '0') === BigInt(params.gasreq)}
                  className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {currentAction === 'updating-gasreq' ? 'Updating...' : 'Update Gas Req'}
                </button>
                </div>
                <div>
                <label className="block text-sm font-medium mb-2">Gas Price</label>
                  <input
                    type="number"
                    value={editGasprice}
                    onChange={(e) => setEditGasprice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                <button
                  onClick={updateGasprice}
                  disabled={currentAction !== 'none' || BigInt(editGasprice || '0') === BigInt(params.gasprice)}
                  className="mt-2 w-full px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {currentAction === 'updating-gasprice' ? 'Updating...' : 'Update Gas Price'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Price Points</div>
              <div className="font-mono">{params.pricePoints?.toString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Step Size</div>
              <div className="font-mono">{params.stepSize?.toString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gas Requirement</div>
              <div className="font-mono">{params.gasreq?.toString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Gas Price</div>
              <div className="font-mono">{params.gasprice?.toString()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Management Actions */}
      <div className="grid grid-cols-3 gap-6">
        {/* Deposit Funds */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold mb-4">Deposit Funds</h4>
            <div className="space-y-4">
                <div>
              <label className="block text-sm font-medium mb-2">
                {formatTokenName(baseToken, baseTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    value={depositBaseAmount}
                    onChange={(e) => setDepositBaseAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                </div>
                <div>
              <label className="block text-sm font-medium mb-2">
                {formatTokenName(quoteToken, quoteTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    value={depositQuoteAmount}
                    onChange={(e) => setDepositQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                </div>
                <button
              onClick={handleDeposit}
                  disabled={currentAction !== 'none' || (!depositBaseAmount && !depositQuoteAmount)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {currentAction === 'depositing' ? 'Depositing...' : 'Deposit'}
                </button>
          </div>
        </div>

        {/* Withdraw Funds */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold mb-4">Withdraw Funds</h4>
            <div className="space-y-4">
                <div>
              <label className="block text-sm font-medium mb-2">
                {formatTokenName(baseToken, baseTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    value={withdrawBaseAmount}
                    onChange={(e) => setWithdrawBaseAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                </div>
                <div>
              <label className="block text-sm font-medium mb-2">
                {formatTokenName(quoteToken, quoteTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    value={withdrawQuoteAmount}
                    onChange={(e) => setWithdrawQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
              </div>
                <button
              onClick={handleWithdraw}
                  disabled={currentAction !== 'none' || (!withdrawBaseAmount && !withdrawQuoteAmount)}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {currentAction === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
                </button>
          </div>
        </div>

        {/* Full Withdraw */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h4 className="text-lg font-semibold mb-4">Full Withdraw</h4>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This will retract all offers and withdraw all funds and provisions. This action cannot be undone.
            </p>
                <button
              onClick={handleFullWithdraw}
              disabled={currentAction !== 'none'}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
              {currentAction === 'full-withdraw' ? 'Withdrawing All...' : 'Withdraw All & Close Position'}
                </button>
              </div>
            </div>
      </div>

      {/* Transaction Status */}
      {(currentAction !== 'none' || isWritePending) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-blue-600 font-medium">Transaction in Progress</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {currentAction === 'updating-step' && 'Updating step size...'}
            {currentAction === 'updating-gasreq' && 'Updating gas requirement...'}
            {currentAction === 'updating-gasprice' && 'Updating gas price...'}
            {currentAction === 'depositing' && 'Depositing funds...'}
            {currentAction === 'withdrawing' && 'Withdrawing funds...'}
            {currentAction === 'full-withdraw' && 'Performing full withdrawal...'}
          </div>
          {txHash && (
            <div className="text-xs text-gray-500 mt-1 font-mono">
              Transaction: {txHash}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
