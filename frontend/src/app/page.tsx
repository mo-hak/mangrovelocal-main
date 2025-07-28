'use client'

import { WalletConnect } from '@/components/WalletConnect'
import { OrderBook } from '@/components/OrderBook'
import { KandelPositionManager } from '@/components/KandelPositionManager'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useUserPositions } from '@/hooks/useUserPositions'

export default function Home() {
  // Fetch user's Kandel positions to get their addresses
  const { positions: userPositions } = useUserPositions()
  
  // Extract Kandel addresses from user positions
  const userKandelAddresses = userPositions.map(position => position.address)

  return (
    <ErrorBoundary>
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Kandel Position Manager</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <WalletConnect />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <OrderBook userKandelAddresses={userKandelAddresses} />
          <div>
            <KandelPositionManager />
          </div>
        </div>
      </div>
    </main>
    </ErrorBoundary>
  )
}