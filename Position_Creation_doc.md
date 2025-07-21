# Kandel Position Creation: A Developer's Guide

This document provides a detailed, step-by-step guide for developers to implement the creation of a Kandel liquidity position. It outlines a user-friendly, interactive process from UI input to the final on-chain transactions, based on the provided smart contract documentation and helper library files.

### High-Level DApp Flow

The creation process is a two-transaction sequence:

1.  **Deploy:** A call is made to the `KandelSeeder` contract to deploy a new, un-initialized Kandel contract instance.
2.  **Populate & Fund:** A second call is made to the newly created Kandel contract's address. This call configures all the strategy's parameters, publishes the offers to the order book, and transfers the user's initial token inventory and the required native token gas provision into the contract.

---

### Step 1: Interactive UI and Real-Time Off-Chain Validation

To create a seamless user experience, the DApp should use the off-chain helper library to provide real-time feedback to the user as they input their parameters. This process is broken into two phases.

**Phase 1: Defining the Strategy Shape**
First, the user fills in the parameters that define the geometry and structure of their Kandel strategy.
* **Market:** The user selects a market (e.g., ETH/USDC). Your DApp should have the corresponding `base` token, `quote` token, and `tickSpacing`.
* **Price Range:** The user provides a `minPrice` and `maxPrice`.
* **Mid Price:** The user provides the `midPrice`, which is the current price to center the distribution.
* **Offer Density:** The user specifies the number of `pricePoints` (total offers) for their strategy.
* **Step Size:** The user provides the `stepSize`.

**Off-Chain Calculation of Minimums**
As soon as the user completes Phase 1, your DApp should immediately call the `validateKandelParams` function in the background which is available as `import {validateKandelParams} from '@mangrovedao/mgv'`
* **Action:** Call `validateKandelParams` with all the parameters from Phase 1, using placeholder values for the inventory (e.g., `baseAmount: 0n`, `quoteAmount: 0n`).
* **Purpose:** The goal of this initial call is to extract the calculated minimums and the required gas provision from the return object.
* **Result:** Your DApp receives the `minBaseAmount`, `minQuoteAmount`, and `minProvision` from the returned `ValidateParamsResult` object.

**Phase 2: Funding the Strategy with Real-Time Guidance**
The UI now presents the input boxes for the initial inventory, enhanced with the data calculated above.
* **Initial Inventory:** The input fields for `baseAmount` and `quoteAmount` display dynamic helper text, such as *"Minimum required: [minBaseAmount]"* and *"Minimum required: [minQuoteAmount]"* respectively.
* **Gas Provision (Bounty):** The UI must clearly inform the user that, in addition to their token inventory, a gas provision is required. This provision is paid in the network's native token (e.g., ETH, MATIC) and comes directly from their wallet. The UI should display this cost: *"Required Provision: [minProvision] MATIC"*.

**Final Validation**
As the user enters their desired `baseAmount` and `quoteAmount`, the DApp calls `validateKandelParams` again in real-time.
* **Action:** Call `validateKandelParams` with the complete set of parameters, including the user's actual inventory inputs.
* **Purpose:** This second call is used to check the `isValid` boolean flag from the returned `ValidateParamsResult` object.
* **Result:**
    * If `isValid` is `false`, the UI can show an error (e.g., "Base amount is below the required minimum") and keep the submission button disabled.
    * If `isValid` is `true`, error messages are cleared, and the "Create Position" button is enabled. The final, valid `ValidateParamsResult` object is stored and ready for the on-chain steps.

### Step 2: On-Chain - Transaction 1 (Deploy Kandel Contract)

This step deploys the empty Kandel instance.

* **Action:** Your DApp will call the `sow` function on the main `KandelSeeder` contract.
* **Arguments:**
    * `olKeyBaseQuote`: The `OLKey` struct representing the market.
    * `liquiditySharing`: A `bool`, which should be `false` for a standard user position.
* **Result:** This transaction returns the `address` of the new Kandel contract. Your DApp must capture this address for the next step. The transaction also emits a `NewKandel` event.

### Step 3: On-Chain - Transaction 2 (Populate and Fund Kandel)

With the new Kandel address, you can now initialize and fund the user's strategy.

* **ERC20 Approvals:** Before calling the populate function, the user must grant the new Kandel contract an allowance to spend their tokens. Your DApp must prompt the user to sign two separate `approve` transactions for the `baseAmount` and `quoteAmount`.

* **Action:** Once the approvals are confirmed, your DApp will call the `populateFromOffset` function on the new Kandel contract address obtained in Step 2. its abi is in `kandelLib.ts`

* **Arguments:** The arguments are sourced directly from the final `ValidateParamsResult` object generated in Step 1.
    * `from`: `0`
    * `to`: The `pricePoints` from `ValidateParamsResult.params`
    * `baseQuoteTickIndex0`: from `ValidateParamsResult.params`
    * `_baseQuoteTickOffset`: from `ValidateParamsResult.params`
    * `firstAskIndex`: from `ValidateParamsResult.params`
    * `bidGives`: from `ValidateParamsResult.params`
    * `askGives`: from `ValidateParamsResult.params`
    * `parameters`: A `CoreKandel.Params` struct built from the `ValidateParamsResult.rawParams`.
    * `baseAmount`: The final `baseAmount` from `ValidateParamsResult.rawParams`.
    * `quoteAmount`: The final `quoteAmount` from `ValidateParamsResult.rawParams`.

* **Native Token for Bounty:** The `populateFromOffset` function is `payable`. Your DApp must include the native token bounty by setting the transaction's `value` to the `minProvision` calculated in `ValidateParamsResult`. This amount is transferred directly from the user's wallet.

* **Confirmation:** Once this final transaction is successfully mined, the user's Kandel position is fully deployed and active. The contract will have pulled the user's funds, stored the bounty, and published the offers to the Mangrove order book.