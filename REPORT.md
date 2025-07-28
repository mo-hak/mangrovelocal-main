# Report


## My understanding of Mangrove and Kandel Strategy

### Mangrove
At its core, Mangrove is an order book decentralized exchange where liquidity is not locked and a "smart offer strategy" dictates how that liquidity behaves. Unlike traditional DEXs that lock up liquidity, Mangrove's offers are essentially promises to trade, allowing Makers(liquidity providers) to build custom strategies. For ex- A Maker can keep their assets productive in other protocols and when Taker comes to take the prommised offer, Maker's liqudity will be sourced Just-in-Time from wherever it is stored. Kandel is another powerfull strategy discussed later.
All of this is possible because of "smart offers" which allows arbitrary smart contract code to be attached to an offer.

#### Order Book Structure

Offers are organized into offer lists, with each market having two lists:

- **Asks Offer List**: Where offers sell the base token (token0) (Taker provides the quote token (token1))
- **Bids Offer List**: Where offers sell the quote token (token1) (Taker provides the base token (token0))

In the exercise USDC/WETH market was implemented i.e token0 as USDC and token1 as WETH. The deployment script intended to have WETH as token0 and USDC as token1 (interpreting the market as WETH/USDC following the common convention of expressing WETH price in terms of USDC). However, Mangrove reorders tokens according to their address size, which made USDC base token. This means USDC price gets represented in terms of WETH (This initially confused me because I expected the implementation to follow the standard market convention, especially since that's exactly how deployment script was also written).

Within an offer list, offers are grouped by ticks, which represent discrete price levels. The price is derived from the tick, and offers at the same tick are executed in a First-In, First-Out order.

With smart offers, Makers can include defensive code to cancel a trade if market conditions have become unsatisfactory.
But what if everyone makes empty promises, and the offers in the book are all meant to fail?

#### Provisions

A critical component of the Mangrove engine is the provision system, which addresses the potential issue of "empty promises" offers that are posted but are intended to fail.
To ensure that the offers on the order book are credible, Makers must deposit a provision in the native token. If an offer fails to execute when a Taker attempts to fill it, a portion of this provision, known as the bounty, is paid to the Taker as compensation for the wasted gas fees. This creates a financial disincentive for Makers to post frivolous or unreliable offers.

##### Provision Calculation

The required provision amount is calculated using the following formula:

$$\text{provision} = \max(\text{gasprice}_{\text{mgv}}, \text{gasprice}_{\text{ofr}}) \times (\text{gasreq} + \text{gasbase}_{\text{mgv}}) \times 10^6$$

**Parameters:**
- **$\text{gasprice}_{\text{mgv}}$**: The global governance `gasprice` parameter (in Mwei per gas unit)
- **$\text{gasprice}_{\text{ofr}}$**: The `gasprice` argument passed to `newOffer` or `updateOffer` functions (in Mwei per gas unit)
- **$\text{gasreq}$**: The amount of gas units required to execute the offer
- **$\text{gasbase}_{\text{mgv}}$**: The local governance `offer_gasbase` parameter

##### Implementation Notes

During development, I encountered some challenges with provision calculations for Kandel offers. The Mangrove library calculates provisions using the globally stored gasprice only. Initially, position creation transactions were failing on Anvil with the stored gasprice value of `1`.

I suspected the issue was related to the formula expecting gasprice in Mwei, so I converted it to `1e6`. While this worked, I realized it was also working with a gasprice value of 600 (from Base testnet), which is significantly lower than `10^6`. Through trial and error, the minimum integer multiplier that worked for successful transactions was `gasprice * 4`.

Due to time constraints, I couldn't dive deeper into debugging this specific issue. This remains an area for further debugging for me.

### Kandel Strategy
Kandel is smart offer strategy that functions like a bot. Its primary goal is to buy low and sell high within a user-defined price range, generating profit from the accumulated spread between the buy (Bid) and sell (Ask) offers that are filled. It achieves this by instantly reposting offers based on the on-chain order flow.

#### How Kandel Moves Liquidity and Reposts Offers
Kandel's core logic is a continuous cycle of buying, selling, and moving liquidity across the price grid. This process is automatic and reactive to trades as they occur.

Scenario A: A Bid is Taken (Buying Low)

When a trader takes one of Kandel's bids, the strategy contract sends the agreed-upon amount of quote tokens (WETH in our implementation) and receives the base tokens (USDC).

The newly acquired base tokens are then immediately used to post a new Ask offer at a higher price point on the grid (specifically, one step above the bid that was just filled). This new offer is referred to as a "dual offer".

Scenario B: An Ask is Taken (Selling High)

Conversely, when one of Kandel's asks is taken, the contract sends the base tokens (USDC) and receives the quote tokens (ETH).

The newly received quote tokens are then used to post a new Bid offer at a lower price point on the grid (one step below the ask that was just filled).

This dynamic ensures that as the market price moves, Kandel continuously repositions its liquidity(upto Price point) to maintain a series of bids below the market price and asks above it, always ready to trade.

#### How Kandel Generates and Reinvests Returns
Profit is generated from the spread-difference in price between where Kandel buys and where it sells. This profit is automatically compounded back into the strategy.

Profit Calculation: The profit is the difference between the quote tokens received from an Ask and the quote tokens spent on its corresponding Bid. For example lets take an ETH/USDC market type for better understanding, if Kandel spends 3000 USDC to buy 1 ETH (a bid) and later sells that 1 ETH for 3050 USDC (an ask), the profit is 50 USDC.

Automatic Reinvestment: This profit is not held separately; it is immediately reinvested. When the strategy posts the new bid after selling high, it includes the profit. In the example above, the new bid would be for a larger amount (e.g., 3050 USDC), effectively increasing the capital working in the strategy and compounding the returns over time.



## Implementation

### Executive Summary

This details the complete implementation of a Kandel liquidity position management frontend application built according to the specifications outlined in the README. The application successfully provides a comprehensive interface for creating, viewing, editing, and withdrawing Kandel positions on the Mangrove DEX protocol.

### 1. Technical Architecture

#### Framework and Technology Stack

The application is built using modern web technologies:

- **Frontend Framework**: Next.js 14 with TypeScript
- **Blockchain Integration**: wagmi 2.0 + viem 2.0 for Web3 interactions
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Query (@tanstack/react-query) for efficient data fetching
- **Onchian Integration**: Smart Contracts and @mangrovedao/mgv library for Kandel-specific utilities

### 2. Core Feature Implementation

#### A. Wallet & Network Connection

**Implementation Location**: `src/components/WalletConnect.tsx`, `src/utils/config.ts`

The wallet connection system successfully integrates with:
- **Supported Wallets**: MetaMask, Injected wallets
- **Network Configuration**: Local Anvil instance (chainId 31337) at `http://127.0.0.1:8545`
- **Hydration Handling**: Proper SSR/client-side rendering to prevent hydration mismatches

#### B. Order Book Visualization

**Implementation Location**: `src/components/OrderBook.tsx`, `src/hooks/useMangrove.ts`

The order book component provides comprehensive market visualization:

**Market Data Fetching**:
- Fetches all open markets using `MgvReader.openMarkets()`
- Real-time offer lists for both bid and ask sides with proper ticks to price conversion using mgv tick library.

**User Offer Highlighting**:
- Blue highlighting for user's Kandel offers in the order book
- Real-time verification of offer ownership via `offer.maker === kandelAddress`

#### C. Kandel Position Creation

**Implementation Location**: `src/components/KandelPosition.tsx`, `src/hooks/useKandelPositionCreation.ts`

The creation process is a two-transaction sequence:

1.  **Deploy:** A call is made to the `KandelSeeder` contract to deploy a new, un-initialized Kandel contract instance.
2.  **Populate & Fund:** A second call is made to the newly created Kandel contract's address. This call configures all the strategy's parameters, publishes the offers to the order book, and transfers the user's initial token inventory and the required native token gas provision into the contract.


##### Step 1: Interactive UI and Real-Time Off-Chain Validation

To create a seamless user experience, the DApp uses the off-chain helper library to provide real-time feedback to the user as they input their parameters. This process is broken into two phases.

**Phase 1: Defining the Strategy Shape**
First, the user fills in the parameters that define the geometry and structure of their Kandel strategy.
* **Market:** The user selects a market (e.g., USDC/WETH) and DApp provides the corresponding `base` token, `quote` token, and `tickSpacing`.
* **Price Range:** The user provides a `minPrice` and `maxPrice`.
* **Mid Price:** The user provides the `midPrice`, which is the current price to center the distribution.
* **pricePoints:** The user specifies the number of offers for their strategy.
* **Step Size:** The user provides the `stepSize`.

**Off-Chain Calculation of Minimums**
As soon as the user completes Phase 1, DApp immediately calls the `validateKandelParams` function from `@mangrovedao/mgv`
* **Action:** Call `validateKandelParams` with all the parameters from ui and other paramaeters as shown in the below code snippet.
* **Purpose:** The goal of this initial call is to extract the calculated minimums and the required gas provision from the return object.
* **Result:** DApp receives the `minBaseAmount`, `minQuoteAmount`, and `minProvision` from the returned `ValidateParamsResult` object.
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
          marketConfig: setup._globalConfig, // fetched from mgvReader globalUnpacked function containing gasprice which is modified to 4*gasprice
        } as any

        const result = validateKandelParams(phase1ValidationParams)
```

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

##### Step 2: On-Chain - Transaction 1 (Deploy Kandel Contract)

This step deploys the empty Kandel instance.

* **Action:** DApp will call the `sow` function on the main `KandelSeeder` contract.
* **Arguments:**
    * `olKeyBaseQuote`: The `OLKey` struct representing the market.
    * `liquiditySharing`: A `bool`, which is set to `false` for a standard user position.
* **Result:** This transaction returns the `address` of the new Kandel contract. DApp captures this address for the next step.

##### Step 3: On-Chain - Transaction 2 (Populate and Fund Kandel)

With the new Kandel address, the user's strategy you is initialized and funded.

* **Approvals:** Before calling the populate function, DApp prompts the user to sign `approve` transactions for the `baseAmount` and `quoteAmount`.

* **Action:** Once the approvals are confirmed, DApp calls the `populateFromOffset` function on the new Kandel contract address obtained in Step 2.

* **Arguments:** The arguments are sourced directly from the final `ValidateParamsResult` object generated in Step 1.

* **Confirmation:** Once this final transaction is successfully mined, the user's Kandel position is fully deployed and active. The contract will have pulled the user's funds, stored the provision, and published the offers to the Mangrove order book.


#### Position Viewing and Management

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


### Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/mo-hak/mangrovelocal-main.git
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   bun i
   
   # Install frontend dependencies
   cd frontend
   npm i
   ```

3. **Run Deploy Script in Root Directory**
   ```bash
   bun src/index
   ```

4. **Start the Application**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - Connect your wallet (MetaMask recommended)
   - Switch to the local network (Chain ID: 31337)(Remeber to add the the anvil account)
   - Start creating and managing Kandel positions!

---

## Kandel APR Calculation Methodology

### Core Principle

The core principle is to take a snapshot of the total value of the inventory at the beginning and end of a period, using the *same price* for both calculations. This neutralizes the effect of market price changes and measures only the value generated by the trading strategy.

### Step 1: Record the Initial State (T₀)

At the beginning of the measurement period, we would record the initial inventory and establish a reference price.

1. **Get Initial Inventory**: Query the Kandel contract to find the amount of `base` and `quote` tokens it holds in its reserve. The `reserveBalance` function can be used for this.
   - `initial_base_inventory`
   - `initial_quote_inventory`

2. **Set a Reference Price**: Determine a fixed `reference_price` to value the inventory. A good option is the mid-price of the Kandel grid at this starting moment. This price should be expressed in `quote` per `base`.

3. **Calculate Initial Total Value**: Convert the entire inventory's value into a single token term (e.g., its `quote` token equivalent) using the reference price.
   - `initial_total_value = (initial_base_inventory * reference_price) + initial_quote_inventory`

### Step 2: Record the Final State (T₁)

At the end of the measurement period (e.g., after 24 hours, 1 week, etc depends on stability of tokens), record the new state of the inventory.

1. **Get Final Inventory**: Query the `reserveBalance` function again to get the final token counts.
   - `final_base_inventory`
   - `final_quote_inventory`

2. **Calculate Final Total Value**: Calculate the new total value using the **same** `reference_price` from Step 1. This is the crucial step that isolates the strategy's performance.
   - `final_total_value = (final_base_inventory * reference_price) + final_quote_inventory`

### Step 3: Calculate Earnings and APR

The difference between the final and initial values represents the profit generated by the spread, which Kandel automatically reinvests.

1. **Calculate Earnings**:
   - `earnings = final_total_value - initial_total_value`

2. **Calculate the Return Rate** for the period:
   - `period_return_rate = earnings / initial_total_value`

3. **Annualize the Return (APR)**:
   - `APR = period_return_rate * (365 / measurement_period_in_days)`

### Important Considerations

#### Handling Deposits and Withdrawals

This calculation assumes no new capital is added or removed during the measurement period. If funds are deposited or withdrawn, the `initial_total_value` must be adjusted to get an accurate performance figure. These capital flows can be tracked off-chain by listening for the `Credit` and `Debit` events emitted by the Kandel contract.

#### Choice of Reference Price

While the Kandel grid's mid-price is a good neutral starting point, any consistent price can be used. The key is to use the exact same price for both the initial and final calculations to ensure you are only measuring the increase in token quantity from trading, not from asset appreciation.

