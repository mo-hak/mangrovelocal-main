'use client'

import { useTokenInfo } from '@/hooks/useTokenInfo'

interface TokenDisplayProps {
  address: `0x${string}` | undefined
  showFullName?: boolean
  showTooltip?: boolean
  className?: string
}

export function TokenDisplay({ 
  address, 
  showFullName = false, 
  showTooltip = true,
  className = ""
}: TokenDisplayProps) {
  const { symbol, name, isLoading } = useTokenInfo(address)

  if (isLoading) {
    return (
      <span className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded px-2 py-1 ${className}`}>
        Loading...
      </span>
    )
  }

  const displayText = showFullName ? name : symbol
  const tooltipText = `${name} (${symbol})`

  return (
    <span 
      className={`font-medium ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      {displayText}
    </span>
  )
}

interface TokenPairDisplayProps {
  token0: `0x${string}` | undefined
  token1: `0x${string}` | undefined
  separator?: string
  className?: string
  showTooltip?: boolean
}

export function TokenPairDisplay({ 
  token0, 
  token1, 
  separator = "/",
  className = "",
  showTooltip = true 
}: TokenPairDisplayProps) {
  return (
    <span className={className}>
      <TokenDisplay address={token0} showTooltip={showTooltip} />
      <span className="mx-1 text-gray-500">{separator}</span>
      <TokenDisplay address={token1} showTooltip={showTooltip} />
    </span>
  )
}

export default TokenDisplay 