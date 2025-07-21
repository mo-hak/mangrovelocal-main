import { createConfig, http } from 'wagmi'
import { foundry } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [foundry],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [foundry.id]: http('http://127.0.0.1:8545'),
  },
})

// Contract addresses from deployment
export const CONTRACTS = {
  MANGROVE: '0x5fbdb2315678afecb367f032d93f642f64180aa3' as `0x${string}`,
  READER: '0xe7f1725e7734ce288f8367e1bb143e90bb3f0512' as `0x${string}`,
  KANDEL_SEEDER: '0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9' as `0x${string}`,
  WETH: '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9' as `0x${string}`,
  USDC: '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707' as `0x${string}`,
}

export const TOKENS = {
  WETH: {
    address: CONTRACTS.WETH,
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
  },
  USDC: {
    address: CONTRACTS.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
}