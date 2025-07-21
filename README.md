# **Technical Task: Kandel Position Management Frontend**

## **1\. Objective**

The goal of this task is to build a small, functional frontend application that allows a user to create, view, edit, and withdraw a Kandel liquidity position on the Mangrove DEX.

This exercise is designed to assess your ability to understand a novel DeFi protocol, interact with smart contracts using modern frontend libraries, and present complex information in a clear, user-friendly way. The final output should be a functional demonstration, not a production-ready application.

## **2\. Background**

Mangrove is a decentralized, order book-based exchange. Unlike AMMs, liquidity on Mangrove is provided as a series of individual offers on an order book.

Kandel is a smart contract that automates the management of concentrated liquidity on Mangrove. It populates an order book with a set of offers distributed around a mid-price. As the market price moves, Kandel intelligently moves the offers to follow it, buying low and selling high to capture spread.

For this task, you will focus on interacting with the kandelSeeder contract, which is the factory for deploying and configuring new Kandel instances.

**Resources:**

- **Mangrove Documentation:** [What is Mangrove?](https://docs.mangrove.exchange/)
- **Kandel Documentation:** [What is kandel ?](https://docs.mangrove.exchange/strategies/kandel/what-is-kandel)

## **3\. Core Task: Frontend Application**

You are to build a single-page application using the latest versions of **Next.js**, **wagmi**, and **viem**.

### **Key Features:**

**A. Wallet & Network Connection:**

- The user must be able to connect their wallet (e.g., MetaMask).
- The application should be configured to run on a local **Anvil** network.

**B. Order Book Visualization:**

- Fetch the live offers for the selected market directly from the chain using the MgvReader contract.
- Create a simple, clear visualization of the order book, highlighting the user's Kandel offers within it. This does not need to be a real-time, streaming chart, but it should accurately reflect the on-chain state when loaded. This will enable you to view if your offers are successfully posted to the book.

**C. Kandel Position Management:**

- **Create a New Kandel Position:**
  - Design a UI form that allows a user to define the parameters for a new Kandel position. This is similar in concept to setting up a concentrated liquidity position in Uniswap v3.
  - **Parameters:** Base token, Quote token, Price Range (min/max), initial inventory, number of offers on each side (bids/asks), and step size.
  - You can use the `createGeometricDistribution` function from `@mangrovedao/mgv` npm package.
- **View & Edit an Existing Position:**
  - After creation, the user should be able to view the state of their Kandel instance.
  - Display key parameters: the assets, the price range, the number of live offers, and the current inventory.
  - Provide functionality to edit the position (e.g., change parameters, deposit/withdraw funds).
- **Withdraw/De-register a Position:**
  - Allow the user to fully withdraw their liquidity and shut down their Kandel instance.

### **Technical & UX Considerations:**

- **Hooks:** Structure your on-chain interactions using custom hooks built with wagmi and viem. Your code should be modular and readable.
- **Offer Provision:** Mangrove offers require a native token provision (value) to cover the gas cost of potential failed deliveries. Your creation logic must account for this, calculating and including the required provision for all offers in the Kandel instance.
- **Minimum Volume:** Kandel offers have a minimum volume requirement. Ensure your UI prevents users from creating offers below this threshold.
- **Clarity:** The code should be well-commented and easy to follow. The goal is a clear demonstration of the core logic.

## **4\. Written Report**

Alongside the code, please provide a brief report in Markdown format that covers:

1. **Your Understanding:** A summary of how you understand the Mangrove core engine (offers, provisions) and Kandel's strategy (how it moves liquidity, reprovisions offers, and generates returns).
2. **APR Calculation Proposal:** Propose a method to calculate an indicative APR for a Kandel position. This calculation should be based on the **generated spread in terms of the tokens**, not on an absolute USD value. Think about how to track the change in inventory over time to represent earnings.

## **5\. Development & Testing Environment**

- **Chain & Contract Deployment:** All testing must be done on a local **Anvil** instance. You will be **provided with a deployment script** to set up the environment. This script will deploy Mangrove, MgvReader, kandelSeeder, mock ERC20s, and create the necessary markets for testing.
- **Tokens:** The provided deployment script will deploy mock ERC20 tokens and include a mint function that you can use at will to get tokens for testing.
- **Contract Addresses:** Your application should be configured to use the addresses generated by the local deployment script.

Current repo holds the deployment script. To deploy all needed contracts, run:

```bash
bun i
bun run src/index.ts
```

The script will start a local anvil instance, deploy mangrove, mangrove reader, kandel seeder, and 2 mock erc20s that only the deployer can mint.

## **6\. What We Expect at Delivery**

1. **Public Git Repository:** A link to a public GitHub (or similar) repository containing your full Next.js application.
2. **Written Report:** The report as a README.md or separate Markdown file in the repository.
3. **Working deployment** of the dapp working on top of our base deployment (provide a URL).
4. **Live Demonstration:** Be prepared to clone your repository, run the application, and give a live demonstration of its full functionality during our interview. You should be able to:
   - Connect a wallet.
   - Create a new Kandel position from scratch.
   - Show the position's offers on the order book visualization.
   - Explain your code structure and the logic behind your wagmi hooks.
   - Discuss your written report.

We **do not** expect a pixel-perfect design, complex off-chain behaviors, subgraphs, or indexing services. The focus is strictly on understanding the protocol and implementing clean, functional on-chain interactions.

## More links

- KandelSeeder Contract: [KandelSeeder.sol](https://github.com/mangrovedao/mangrove-strats/blob/develop/src/strategies/offer_maker/market_making/kandel/KandelSeeder.sol).
- Kandel Contract: [Kandel.sol](https://github.com/mangrovedao/mangrove-strats/blob/develop/src/strategies/offer_maker/market_making/kandel/Kandel.sol).
- Mangrove Offer Making, parent of the mangrove contract responsible for creating/managing offers: [MgvOfferMaking.sol](https://github.com/mangrovedao/mangrove-core/blob/develop/src/core/MgvOfferMaking.sol)
- Mangrove Offer Taking, parent of the mangrove contract responsible for consuming offers: [MgvOfferTaking.sol](https://github.com/mangrovedao/mangrove-core/blob/develop/src/core/MgvOfferTaking.sol)
- Mangrove Reader, peripheral contract that provides a view of the order book: [MgvReader.sol](https://github.com/mangrovedao/mangrove-core/blob/6fa9a5716753e577f127d1b1511304add0b386eb/src/periphery/MgvReader.sol#L201)
- Mangrove, the core contract that manages the order book: [Mangrove.sol](https://github.com/mangrovedao/mangrove-core/blob/develop/src/core/Mangrove.sol)
- mgv, a typescript library for interacting with Mangrove (you can inspire from this, and also use the builder params under @mangrovedao/mgv/builder if needed, though kandel parameters are not actively maintained): [mgv](https://github.com/mangrovedao/mgv)
- To get the list of active kandels, you can use our [base API](https://indexer-base.mgvinfra.com/ui) or our [graphQL api](https://indexer-base.mgvinfra.com)
- Base deployment addresses: [Base Addresses](https://docs.mangrove.exchange/quick-links/deployment-adresses)
