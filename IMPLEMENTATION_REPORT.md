# Implementation Report

## Executive Summary

This report details the complete implementation of a Kandel liquidity position management frontend application built according to the specifications outlined in the README. The application successfully provides a comprehensive interface for creating, viewing, editing, and withdrawing Kandel positions on the Mangrove DEX protocol.

## 1. Technical Architecture

### Framework and Technology Stack

The application is built using modern web technologies:

- **Frontend Framework**: Next.js 14 with TypeScript
- **Blockchain Integration**: wagmi 2.0 + viem 2.0 for Web3 interactions
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Query (@tanstack/react-query) for efficient data fetching
- **Onchian Integration**: Smart Contracts and @mangrovedao/mgv library for Kandel-specific utilities

### Project Structure

```
frontend/
├── src/
│   ├── app/                    
│   │   ├── page.tsx           
│   │   ├── layout.tsx         
│   │   └── providers.tsx      
│   ├── components/            
│   │   ├── WalletConnect.tsx  
│   │   ├── OrderBook.tsx      
│   │   ├── KandelPositionForm.tsx      
│   │   ├── KandelPositionManager.tsx   
│   │   └── KandelPositionView.tsx      
│   ├── hooks/                 
│   │   ├── useKandelManager.ts         
│   │   ├── useMangrove.ts             
│   │   ├── useUserPositions.ts        
│   │   └── useERC20.ts              
│   ├── types/                 
│   │   └── kandel.ts          
│   └── utils/                 
│       ├── config.ts          
│       └── abi/             
```

## 2. Core Feature Implementation

### A. Wallet & Network Connection

**Implementation Location**: `src/components/WalletConnect.tsx`, `src/utils/config.ts`

The wallet connection system successfully integrates with:
- **Supported Wallets**: MetaMask, Injected wallets
- **Network Configuration**: Local Anvil instance (chainId 31337) at `http://127.0.0.1:8545`
- **Hydration Handling**: Proper SSR/client-side rendering to prevent hydration mismatches

### B. Order Book Visualization

**Implementation Location**: `src/components/OrderBook.tsx`, `src/hooks/useMangrove.ts`

The order book component provides comprehensive market visualization:

**Market Data Fetching**:
- Fetches all open markets using `MgvReader.openMarkets()`
- Real-time offer lists for both bid and ask sides with proper ticks to price conversion using mgv tick library.

**User Offer Highlighting**:
- Blue highlighting for user's Kandel offers in the order book
- Real-time verification of offer ownership via `offer.maker === kandelAddress`
- Visual confirmation that offers are successfully posted on-chain

### C. Kandel Position Creation

**Implementation Location**: `src/components/KandelPosition.tsx`, `src/hooks/useKandelManager.ts`

The creation process is a two-transaction sequence:

1.  **Deploy:** A call is made to the `KandelSeeder` contract to deploy a new, un-initialized Kandel contract instance.
2.  **Populate & Fund:** A second call is made to the newly created Kandel contract's address. This call configures all the strategy's parameters, publishes the offers to the order book, and transfers the user's initial token inventory and the required native token gas provision into the contract.


#### Step 1: Interactive UI and Real-Time Off-Chain Validation

To create a seamless user experience, the DApp uses the off-chain helper library to provide real-time feedback to the user as they input their parameters. This process is broken into two phases.

**Phase 1: Defining the Strategy Shape**
First, the user fills in the parameters that define the geometry and structure of their Kandel strategy.
* **Market:** The user selects a market (e.g., ETH/USDC) and DApp provides the corresponding `base` token, `quote` token, and `tickSpacing`.
* **Price Range:** The user provides a `minPrice` and `maxPrice`.
* **Mid Price:** The user provides the `midPrice`, which is the current price to center the distribution.
* **pricePoints:** The user specifies the number of offers for their strategy.
* **Step Size:** The user provides the `stepSize`.

**Off-Chain Calculation of Minimums**
As soon as the user completes Phase 1, DApp immediately calls the `validateKandelParams` function from `@mangrovedao/mgv`
* **Action:** Call `validateKandelParams` with all the parameters from ui and other paramaeters as shown in the below code snippet.
* **Purpose:** The goal of this initial call is to extract the calculated minimums and the required gas provision from the return object.
* **Result:** Your DApp receives the `minBaseAmount`, `minQuoteAmount`, and `minProvision` from the returned `ValidateParamsResult` object.
```typescript
// Phase 1: Call validateKandelParams to get minimums
        const positionParams: RawKandelPositionParams = {
          market: setup.market,
          minPrice: parseFloat(minPrice),
          maxPrice: parseFloat(maxPrice),
          midPrice: parseFloat(midPrice),
          pricePoints: BigInt(pricePoints),
          adjust: true //to find the closest price match
        } as any

        const phase1ValidationParams: RawKandelParams = {
          ...positionParams,
          baseAmount: BigInt(0), // Mock amount to get minimums
          quoteAmount: BigInt(0), // Mock amount to get minimums 
          stepSize: BigInt(stepSize),
          gasreq: 121413n, //As per docs
          factor: 1, // 100% of minVolume, can be set to 1.n for a n% buffer.
          asksLocalConfig: setup.asksLocalConfigData,// fetched from config01 from mgvReader marketConfig function
          bidsLocalConfig: setup.bidsLocalConfigData, // fetched from config10 from mgvReader marketConfig function
          // marketConfig: globalConfig!, // fetched from mgvReader globalUnpacked function
          marketConfig: setup._globalConfig,
        } as any

        const result = validateKandelParams(phase1ValidationParams)
```
Note: `gasreq` is set to `121413` to handel Kandel's most expensive case as mentioned in https://old.docs.mangrove.exchange/developers/strat-lib/guides/howtoGasreq. The `marketconfig` parameter expects a `GlobalUnpacked` struct, which includes a `gasprice` field which the library uses to calculate the minimum provision. Originally, this gasprice was taken from GlobalUnpacked from mgvReader contract, but it was returning a value of `1` that led to the calculated minProvision being way too low, causing transactions to fail. To fix this, I replaced it with a hardcoded _globalconfig object where gasprice is set to `600`. This value was chosen because, on the Base testnet, GlobalUnpacked returned 600 as the gasprice.

**Phase 2: Funding the Strategy with Real-Time Guidance**
The UI now presents the input boxes for the initial inventory, enhanced with the data calculated above.
* **Initial Inventory:** The input fields for `baseAmount` and `quoteAmount` display *"Minimum required: [minBaseAmount]"* and *"Minimum required: [minQuoteAmount]"* respectively.
* **Gas Provision:** The UI displays the user required Provision (minProvision).

**Final Validation**
As the user enters their desired `baseAmount` and `quoteAmount`, the DApp calls `validateKandelParams` again in real-time.
* **Action:** Call `validateKandelParams` with the complete set of parameters, including the user's actual inventory inputs.
* **Purpose:** This second call is used to check the `isValid` boolean flag from the returned `ValidateParamsResult` object.
* **Result:**
    * If `isValid` is `false`, the UI can show an error (e.g., "Base amount is below the required minimum") and keep the submission button disabled.
    * If `isValid` is `true`, error messages are cleared, and the "Create Position" button is enabled. The final, valid `ValidateParamsResult` object is stored and ready for the on-chain steps.

#### Step 2: On-Chain - Transaction 1 (Deploy Kandel Contract)

This step deploys the empty Kandel instance.

* **Action:** DApp will call the `sow` function on the main `KandelSeeder` contract.
* **Arguments:**
    * `olKeyBaseQuote`: The `OLKey` struct representing the market.
    * `liquiditySharing`: A `bool`, which is set to `false` for a standard user position.
* **Result:** This transaction returns the `address` of the new Kandel contract. DApp captures this address for the next step.

#### Step 3: On-Chain - Transaction 2 (Populate and Fund Kandel)

With the new Kandel address, the user's strategy you is initialized and funded.

* **Approvals:** Before calling the populate function, DApp prompts the user to sign `approve` transactions for the `baseAmount` and `quoteAmount`.

* **Action:** Once the approvals are confirmed, DApp calls the `populateFromOffset` function on the new Kandel contract address obtained in Step 2.

* **Arguments:** The arguments are sourced directly from the final `ValidateParamsResult` object generated in Step 1.

* **Confirmation:** Once this final transaction is successfully mined, the user's Kandel position is fully deployed and active. The contract will have pulled the user's funds, stored the provision, and published the offers to the Mangrove order book.


### Position Viewing and Management

**Implementation Location**: `src/components/KandelPositionView.tsx`, `src/hooks/useKandelManager.ts`

**Data Fetching Strategy**:
Uses efficient multicall pattern via `useReadContracts` to fetch:
- Kandel parameters (`params()`)
- Current inventory (`reserveBalance()` for both tokens)
- Live offer volumes (`offeredVolume()` for both sides)

**Position State Display**:
- Current inventory balances for base and quote tokens
- Live offer count and status
- Gas parameters and step size

**Management Operations**:
- **Deposit Funds**: Token approvals + `depositFunds()` call
- **Withdraw Funds**: `withdrawFunds()` with amount validation
- **Parameter Modification**: `setStepSize()`, `setGasreq()`, `setGasprice()`
- **Full Withdrawal**: `retractAndWithdraw()` for complete position closure




At its core, Mangrove operates is an order book decentralized exchange where liquidity is not locked, and a "smart offer strategy" dictates how that liquidity behaves. Unlike traditional DEXs that lock up liquidity, Mangrove's offers are essentially promises to trade, allowing Makers(liquidity providers) to build custom strategies. For ex- A Maker can keep their assets productive in other protocols and as soon as a Taker comes to take the prommised offer, Maker's liqudity will be sourced Just-in-Time from other protocols. Kandel is another powerfull strategy discussed later.

This is possible because of "smart offers" which allows arbitrary smart contract code to be attached to an offer.

Offers are organized into offer lists (unlike traditional two way orderbook) with each market having two such lists: one for "asks"(e.g., selling WETH for DAI) and one for "bids" (e.g., selling DAI for WETH). Within an offer list, offers are grouped by ticks, which represent discrete price levels. The price is derived from the tick, and offers at the same tick are executed in a First-In, First-Out order.

With smart offers, Makers can include defensive code to cancel a trade if market conditions have become unsatisfactory.
But what if everyone makes empty promises, and the offers in the book are all meant to fail?

Provisions: Ensuring the Credibility of Offers
A critical component of the Mangrove engine is the provision system, which is designed to address the potential issue of "empty promises"—offers that are posted but are intended to fail.
To ensure that the offers on the order book are credible, Makers must deposit a provision in the native token. This provision acts as a form of collateral. If an offer fails to execute when a Taker attempts to fill it, a portion of this provision, known as the bounty, is paid to the Taker as compensation for the wasted gas fees. This creates a financial disincentive for Makers to post frivolous or unreliable offers.

Provision Calculation
The amount of provision required for an offer is calculated based on the gas required for the offer's execution (gasreq) and the prevailing gas price on Mangrove. The formula is:

