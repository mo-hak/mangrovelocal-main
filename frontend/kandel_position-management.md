# Engineering Guide: Kandel Position Management

## 1. Objective

This document outlines the implementation plan for viewing, visualizing, editing, and withdrawing an existing Kandel position. Building on the architecture from the creation flow, this guide uses a hook-based approach to encapsulate complex logic, ensuring the UI remains clean and the application is maintainable.

## 2. Core Architecture: The useKandelManager Hook

All logic for an existing position will be centralized in a single custom hook: `useKandelManager`. This hook will be the single source of truth for a selected Kandel instance.

**Input**: The hook will take the user's Kandel contract address and the market details (base, quote, tickSpacing) as props.

**Responsibility**:
- Fetch all on-chain state for the Kandel instance and its market
- Provide derived data for UI rendering (e.g., filtered user offers, price range)
- Expose functions to execute management transactions (deposit, withdraw, etc.)

## 3. Part 1: Viewing and Visualizing the Position

This is the foundational part, focused on reading and presenting on-chain data.

### 3.1. Data Fetching Strategy

The `useKandelManager` hook will perform several read calls to fetch all necessary data. Using wagmi's `useReadContracts` (multicall) is highly recommended for efficiency.

#### A. Fetching Kandel Instance State

These calls target the user's specific Kandel contract address.

**Parameters (params)**:
- **Contract**: CoreKandel (user's Kandel address)
- **Function**: `params()`
- **Returns**: A struct containing `gasprice`, `gasreq`, `stepSize`, and `pricePoints`

**Geometric Parameters (baseQuoteTickOffset)**:
- **Contract**: GeometricKandel (user's Kandel address)
- **Function**: `baseQuoteTickOffset()`
- **Returns**: The tick offset used to construct the price grid

**Current Inventory (reserveBalance)**:
- **Contract**: CoreKandel (user's Kandel address)
- **Function**: `reserveBalance(enum OfferType ba)`
- **Action**: Call this function twice:
  - Once with `OfferType.Asks` (0) to get the base token balance
  - Once with `OfferType.Bids` (1) to get the quote token balance

#### B. Fetching Order Book Data

These calls target the MgvReader contract to get the context of the entire market.

**Ask Offers**:
- **Contract**: MgvReader
- **Function**: `offerList(olKey, fromId, maxOffers)`
- **Action**: Call with the olKey for the asks side of the market (e.g., WETH/USDC)

**Bid Offers**:
- **Contract**: MgvReader
- **Function**: `offerList(olKey, fromId, maxOffers)`
- **Action**: Call with the olKey for the bids side of the market (e.g., USDC/WETH)

### 3.2. UI Implementation: Visualization and State Display

The UI component will consume the data provided by the `useKandelManager` hook.

#### A. Order Book Visualization

- The component receives the full list of `askOffers` and `bidOffers` from the hook
- It iterates through each list to render a simple, two-column view of the order book (prices and volumes)
- **Highlighting Logic**: For each offer rendered, it will check `offer.maker === kandelAddress`. If true, a different CSS class is applied to highlight it as a user's offer. This directly confirms that the offers are successfully posted on-chain.

#### B. Position State Display

The component will display the fetched parameters in a clear "Status" panel:

- **Inventory**: Display the formatted `baseBalance` and `quoteBalance`
- **Price Range**: This must be calculated. Using the `baseQuoteTickIndex0` (from populate logs or re-calculated), `baseQuoteTickOffset`, and `pricePoints`, you can determine the min and max ticks and convert them back to human-readable prices
- **Number of Live Offers**: The UI can get this by counting the highlighted offers in the order book visualization
- **Other Params**: Display `stepSize`, `gasreq`, etc.

## 4. Part 2: Editing the Position

The `useKandelManager` hook will expose functions that wrap wagmi's `useWriteContract` for each editing action.

### A. Deposit/Withdraw Funds

**depositFunds(baseAmount, quoteAmount)**:
- **Action**: This function will first trigger the necessary ERC20 approve transactions
- Upon success, it will call `depositFunds(baseAmount, quoteAmount)` on the Kandel contract address

**withdrawFunds(baseAmount, quoteAmount)**:
- **Action**: Calls `withdrawFunds(baseAmount, quoteAmount, userAddress)` on the Kandel contract
- **Pre-flight Check**: Before enabling the withdraw button, the UI should use the `reserveBalance` data from the hook to ensure the user isn't trying to withdraw more than is available

### B. Change Parameters

**setStepSize(newStepSize)**:
- **Action**: Calls `setStepSize(newStepSize)` on the Kandel contract

> **Note on Major Edits**: The UI should discourage or disallow changing fundamental geometric parameters like `pricePoints`. As noted in the documentation, this requires retracting all offers first. For such cases, guiding the user to the full "Withdraw/De-register" flow is the safer and more robust user experience.

## 5. Part 3: Withdraw/De-register a Position

This is the "nuke" option to completely shut down the strategy and recover all assets.

**deRegisterKandel()**:
- **Action**: This single function will call `retractAndWithdraw` on the Kandel contract address
- **Arguments**: The function will construct the arguments to withdraw the maximum possible amounts, as specified in the documentation:
  - `from`: 0
  - `to`: The total `pricePoints` of the strategy
  - `baseAmount`: `type(uint256).max`
  - `quoteAmount`: `type(uint256).max`
  - `freeWei`: `type(uint256).max`
  - `recipient`: The connected user's wallet address

---

This implementation plan provides a clear roadmap for building out the remaining features in a structured and maintainable way, separating on-chain logic from the UI and ensuring a robust user experience.