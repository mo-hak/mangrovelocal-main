'use client'

import { useState } from 'react'
import { KandelPositionForm } from './KandelPositionForm'
import { KandelPositionView } from './KandelPositionView'
import { useUserPositions } from '@/hooks/useUserPositions'

export function KandelPositionManager() {
  const [view, setView] = useState<'create' | 'view'>('create')
  const [selectedPosition, setSelectedPosition] = useState<{
    address: `0x${string}`
    baseToken: `0x${string}`
    quoteToken: `0x${string}`
  } | null>(null)

  // Fetch user positions from the blockchain
  const { positions: userPositions, isLoading: positionsLoading, error: positionsError, refetch } = useUserPositions()

  // Handler for when a new position is created
  const handlePositionCreated = () => {
    // Switch to positions view and refetch
    setView('view')
    refetch()
  }


  const viewPosition = (position: typeof userPositions[0]) => {
    setSelectedPosition({
      address: position.address,
      baseToken: position.baseToken,
      quoteToken: position.quoteToken,
    })
    setView('view')
  }

  const closePositionView = () => {
    setSelectedPosition(null)
    setView('create')
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Create Position
          </button>
          <button
            onClick={() => setView('view')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            My Positions
          </button>
        </div>

        {/* My Positions List */}
        {view === 'view' && !selectedPosition && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Your Kandel Positions</h3>
            {positionsLoading ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">Loading positions...</div>
              </div>
            ) : positionsError ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-2">Error loading positions</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{positionsError}</div>
              </div>
            ) : userPositions.length > 0 ? (
              <div className="space-y-3">
                {userPositions.map((position, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{position.market}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        {position.address.slice(0, 10)}...{position.address.slice(-8)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Block: {position.blockNumber.toString()}
                      </div>
                    </div>
                    <button
                      onClick={() => viewPosition(position)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <div className="text-lg mb-2">No positions found</div>
                <div className="text-sm">You haven't created any Kandel positions yet.</div>
                <button
                  onClick={() => setView('create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Position
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      {view === 'create' && <KandelPositionForm onPositionCreated={handlePositionCreated} />}
      {view === 'view' && selectedPosition && (
        <KandelPositionView
          kandelAddress={selectedPosition.address}
          baseToken={selectedPosition.baseToken}
          quoteToken={selectedPosition.quoteToken}
          onClose={closePositionView}
        />
      )}
    </div>
  )
}