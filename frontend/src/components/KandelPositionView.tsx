'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useKandelPositionWithTokens } from '@/hooks/useKandel'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { kandelLibABI } from '@/utils/abi/kandelLib'
import { erc20Abi } from '@/utils/abi/erc20'

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
  const { position, isLoading, error } = useKandelPositionWithTokens(kandelAddress, baseToken, quoteToken)
  const { writeContract, data: txHash, isPending: isWritePending } = useWriteContract()
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editStepSize, setEditStepSize] = useState<string>('')
  const [editGasreq, setEditGasreq] = useState<string>('')
  const [editGasprice, setEditGasprice] = useState<string>('')

  // Deposit/Withdraw states
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [depositBaseAmount, setDepositBaseAmount] = useState<string>('')
  const [depositQuoteAmount, setDepositQuoteAmount] = useState<string>('')
  const [withdrawBaseAmount, setWithdrawBaseAmount] = useState<string>('')
  const [withdrawQuoteAmount, setWithdrawQuoteAmount] = useState<string>('')

  // Transaction state
  const [currentAction, setCurrentAction] = useState<'none' | 'updating' | 'depositing' | 'withdrawing' | 'full-withdraw'>('none')

  // Format token names for display
  const formatTokenName = (address: `0x${string}`, symbol?: string) => {
    return symbol || `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Initialize edit values when entering edit mode
  useEffect(() => {
    if (isEditMode && position && position.params) {
      setEditStepSize(position.params.stepSize?.toString() || '')
      setEditGasreq(position.params.gasreq?.toString() || '')
      setEditGasprice(position.params.gasprice?.toString() || '')
    }
  }, [isEditMode, position])

  // Update Kandel parameters
  const updateParameters = async () => {
    if (!position || !editStepSize || !editGasreq || !editGasprice) return

    setCurrentAction('updating')

    try {
      // Update step size if changed
      const newStepSize = editStepSize ? Number(editStepSize) : 0
      if (!Number.isFinite(newStepSize) || newStepSize <= 0) {
        console.error('Invalid step size:', editStepSize)
        setCurrentAction('none')
        return
      }
      if (position.params?.stepSize && BigInt(newStepSize) !== position.params.stepSize) {
        await writeContract({
          address: kandelAddress,
          abi: kandelLibABI,
          functionName: 'setStepSize',
          args: [BigInt(newStepSize)],
        })
        return
      }

      // Update gasreq if changed
      const newGasreq = editGasreq ? Number(editGasreq) : 0
      if (!Number.isFinite(newGasreq) || newGasreq <= 0) {
        console.error('Invalid gasreq:', editGasreq)
        setCurrentAction('none')
        return
      }
      if (position.params?.gasreq && BigInt(newGasreq) !== position.params.gasreq) {
        await writeContract({
          address: kandelAddress,
          abi: kandelLibABI,
          functionName: 'setGasreq',
          args: [BigInt(newGasreq)],
        })
        return
      }

      // Update gasprice if changed
      const newGasprice = editGasprice ? Number(editGasprice) : 0
      if (!Number.isFinite(newGasprice) || newGasprice <= 0) {
        console.error('Invalid gasprice:', editGasprice)
        setCurrentAction('none')
        return
      }
      if (position.params?.gasprice && BigInt(newGasprice) !== position.params.gasprice) {
        await writeContract({
          address: kandelAddress,
          abi: kandelLibABI,
          functionName: 'setGasprice',
          args: [BigInt(newGasprice)],
        })
        return
      }

      setCurrentAction('none')
      setIsEditMode(false)
    } catch (error) {
      console.error('Update parameters error:', error)
      setCurrentAction('none')
    }
  }

  // Deposit funds
  const depositFunds = async () => {
    if (!position || (!depositBaseAmount && !depositQuoteAmount)) return

    setCurrentAction('depositing')

    try {
      let baseAmount = 0n
      let quoteAmount = 0n
      
      try {
        baseAmount = depositBaseAmount && Number.isFinite(Number(depositBaseAmount)) 
          ? parseUnits(depositBaseAmount, position.baseTokenInfo.decimals) 
          : 0n
        quoteAmount = depositQuoteAmount && Number.isFinite(Number(depositQuoteAmount))
          ? parseUnits(depositQuoteAmount, position.quoteTokenInfo.decimals) 
          : 0n
      } catch (error) {
        console.error('Error parsing deposit amounts:', error)
        setCurrentAction('none')
        return
      }

      // Approve tokens first if needed
      if (baseAmount > 0n) {
        await writeContract({
          address: baseToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [kandelAddress, baseAmount],
        })
        // Wait for approval before depositing
        return
      }

      if (quoteAmount > 0n) {
        await writeContract({
          address: quoteToken,
          abi: erc20Abi,
          functionName: 'approve',
          args: [kandelAddress, quoteAmount],
        })
        return
      }

      // If no approvals needed, deposit directly
      await writeContract({
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'depositFunds',
        args: [baseAmount, quoteAmount],
      })
    } catch (error) {
      console.error('Deposit error:', error)
      setCurrentAction('none')
    }
  }

  // Withdraw funds
  const withdrawFunds = async () => {
    if (!position || (!withdrawBaseAmount && !withdrawQuoteAmount) || !address) return

    setCurrentAction('withdrawing')

    try {
      let baseAmount = 0n
      let quoteAmount = 0n
      
      try {
        baseAmount = withdrawBaseAmount && Number.isFinite(Number(withdrawBaseAmount))
          ? parseUnits(withdrawBaseAmount, position.baseTokenInfo.decimals) 
          : 0n
        quoteAmount = withdrawQuoteAmount && Number.isFinite(Number(withdrawQuoteAmount))
          ? parseUnits(withdrawQuoteAmount, position.quoteTokenInfo.decimals) 
          : 0n
      } catch (error) {
        console.error('Error parsing withdraw amounts:', error)
        setCurrentAction('none')
        return
      }

      await writeContract({
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'withdrawFunds',
        args: [baseAmount, quoteAmount, address],
      })
    } catch (error) {
      console.error('Withdraw error:', error)
      setCurrentAction('none')
    }
  }

  // Full withdraw and de-register
  const fullWithdraw = async () => {
    if (!position || !address) return

    setCurrentAction('full-withdraw')

    try {
      // First retract all offers
      await writeContract({
        address: kandelAddress,
        abi: kandelLibABI,
        functionName: 'retractOffers',
        args: [0n, (position.params?.pricePoints ? position.params.pricePoints - 1n : 0n)],
      })
    } catch (error) {
      console.error('Full withdraw error:', error)
      setCurrentAction('none')
    }
  }

  // Handle transaction completion
  useEffect(() => {
    if (txReceipt?.status === 'success') {
      if (currentAction === 'depositing') {
        // If this was an approval, now do the actual deposit
        let baseAmount = 0n
        let quoteAmount = 0n
        
        try {
          baseAmount = depositBaseAmount && Number.isFinite(Number(depositBaseAmount))
            ? parseUnits(depositBaseAmount, position!.baseTokenInfo.decimals)
            : 0n
          quoteAmount = depositQuoteAmount && Number.isFinite(Number(depositQuoteAmount))
            ? parseUnits(depositQuoteAmount, position!.quoteTokenInfo.decimals)
            : 0n
        } catch (error) {
          console.error('Error parsing deposit amounts for approval completion:', error)
          return
        }
        
        writeContract({
          address: kandelAddress,
          abi: kandelLibABI,
          functionName: 'depositFunds',
          args: [baseAmount, quoteAmount],
        })
        return
      }

      if (currentAction === 'full-withdraw') {
        // After retracting offers, do final withdraw
        writeContract({
          address: kandelAddress,
          abi: kandelLibABI,
          functionName: 'retractAndWithdraw',
          args: [
            0n, 
            (position!.params?.pricePoints ? position!.params.pricePoints - 1n : 0n), 
            2n**256n - 1n, // MAX_UINT
            2n**256n - 1n, // MAX_UINT 
            0n, // freeWei
            address!
          ],
        })
        return
      }

      // Reset states for completed actions
      setCurrentAction('none')
      setIsEditMode(false)
      setShowDepositModal(false)
      setShowWithdrawModal(false)
      setDepositBaseAmount('')
      setDepositQuoteAmount('')
      setWithdrawBaseAmount('')
      setWithdrawQuoteAmount('')
    }
  }, [txReceipt])

  if (!address) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">View Kandel Position</h3>
        <p className="text-gray-600 dark:text-gray-400">Please connect your wallet to view positions.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Kandel Position</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="text-center py-4">Loading position...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Kandel Position</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-medium">Error Loading Position</div>
          <div className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</div>
        </div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Kandel Position</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Position not found or failed to load.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Kandel Position</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      {/* Position Overview */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium mb-3">Position Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Address:</span>
              <div className="font-mono">{kandelAddress.slice(0, 10)}...{kandelAddress.slice(-8)}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Market:</span>
              <div>{formatTokenName(baseToken, position.baseTokenInfo.symbol)}/{formatTokenName(quoteToken, position.quoteTokenInfo.symbol)}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Price Points:</span>
              <div>{position.params?.pricePoints?.toString() || 'N/A'}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Step Size:</span>
              <div>{position.params?.stepSize?.toString() || 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Current Inventory */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium mb-3">Current Inventory</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatTokenName(baseToken, position.baseTokenInfo.symbol)} Reserve
              </div>
              <div className="text-lg font-medium">
                {formatUnits(position.baseReserve, position.baseTokenInfo.decimals)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatTokenName(quoteToken, position.quoteTokenInfo.symbol)} Reserve
              </div>
              <div className="text-lg font-medium">
                {formatUnits(position.quoteReserve, position.quoteTokenInfo.decimals)}
              </div>
            </div>
          </div>
        </div>

        {/* Live Offers */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="font-medium mb-3">Live Offers</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatTokenName(baseToken, position.baseTokenInfo.symbol)} Offered (Asks)
              </div>
              <div className="text-lg font-medium">
                {formatUnits(position.baseOfferedVolume, position.baseTokenInfo.decimals)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatTokenName(quoteToken, position.quoteTokenInfo.symbol)} Offered (Bids)
              </div>
              <div className="text-lg font-medium">
                {formatUnits(position.quoteOfferedVolume, position.quoteTokenInfo.decimals)}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Parameters */}
        {isEditMode ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3">Edit Parameters</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Step Size</label>
                  <input
                    type="number"
                    min="1"
                    value={editStepSize}
                    onChange={(e) => setEditStepSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gas Req</label>
                  <input
                    type="number"
                    min="21000"
                    value={editGasreq}
                    onChange={(e) => setEditGasreq(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gas Price</label>
                  <input
                    type="number"
                    min="1"
                    value={editGasprice}
                    onChange={(e) => setEditGasprice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={updateParameters}
                  disabled={currentAction !== 'none'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {currentAction === 'updating' ? 'Updating...' : 'Update Parameters'}
                </button>
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Action Buttons */
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsEditMode(true)}
              disabled={currentAction !== 'none'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Edit Parameters
            </button>
            <button
              onClick={() => setShowDepositModal(true)}
              disabled={currentAction !== 'none'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Deposit Funds
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={currentAction !== 'none'}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              Withdraw Funds
            </button>
            <button
              onClick={fullWithdraw}
              disabled={currentAction !== 'none'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {currentAction === 'full-withdraw' ? 'Withdrawing...' : 'Full Withdraw & Close'}
            </button>
          </div>
        )}

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3">Deposit Funds</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formatTokenName(baseToken, position.baseTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={depositBaseAmount}
                    onChange={(e) => setDepositBaseAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formatTokenName(quoteToken, position.quoteTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={depositQuoteAmount}
                    onChange={(e) => setDepositQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={depositFunds}
                  disabled={currentAction !== 'none' || (!depositBaseAmount && !depositQuoteAmount)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {currentAction === 'depositing' ? 'Depositing...' : 'Deposit'}
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h4 className="font-medium mb-3">Withdraw Funds</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formatTokenName(baseToken, position.baseTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={formatUnits(position.baseReserve, position.baseTokenInfo.decimals)}
                    value={withdrawBaseAmount}
                    onChange={(e) => setWithdrawBaseAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Max: {formatUnits(position.baseReserve, position.baseTokenInfo.decimals)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formatTokenName(quoteToken, position.quoteTokenInfo.symbol)} Amount
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={formatUnits(position.quoteReserve, position.quoteTokenInfo.decimals)}
                    value={withdrawQuoteAmount}
                    onChange={(e) => setWithdrawQuoteAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0.0"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Max: {formatUnits(position.quoteReserve, position.quoteTokenInfo.decimals)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={withdrawFunds}
                  disabled={currentAction !== 'none' || (!withdrawBaseAmount && !withdrawQuoteAmount)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {currentAction === 'withdrawing' ? 'Withdrawing...' : 'Withdraw'}
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}