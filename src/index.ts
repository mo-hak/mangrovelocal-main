import { anvil } from "prool/instances";
import {
  createTestClient,
  createWalletClient,
  parseUnits,
  publicActions,
  testActions,
  walletActions,
  type Address,
  type Hex,
} from "viem";
import { mnemonicToAccount } from "viem/accounts";
import { ipc } from "viem/node";
import { mangroveBytecode } from "./bytecode/mangrove";
import { MangroveABI } from "./abi/mangrove";
import { foundry } from "viem/chains";
import { kandelLibBytecode } from "./bytecode/kandelLib";
import { seederBytecode } from "./bytecode/seeder";
import { kandelSeederABI } from "./abi/kandelSeeder";
import { erc20Abi } from "./abi/erc20";
import { erc20 } from "./bytecode/erc20";
import { floatToFixed96x32 } from "./lib/density";
import { readerBytecode } from "./bytecode/reader";
import { readerAbi } from "./abi/reader";

const mnemonic = "test test test test test test test test test test test junk";

const instance = anvil({ port: 8545, ipc: "/tmp/mangrove.ipc", mnemonic });
await instance.start();
console.log("Connected to anvil");

const client = createWalletClient({
  transport: ipc("/tmp/mangrove.ipc"),
  account: mnemonicToAccount(mnemonic),
  chain: foundry,
})
  .extend(testActions({ mode: "anvil" }))
  .extend(publicActions);

// deploying mangrove
async function deployMangrove() {
  const tx = await client.deployContract({
    bytecode: mangroveBytecode,
    abi: MangroveABI,
    args: [client.account.address, 1n, 2_000_000n],
  });
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  if (!receipt.contractAddress) {
    throw new Error("Mangrove deployment failed");
  }
  console.log("Mangrove: ", receipt.contractAddress);
  return receipt.contractAddress;
}

async function deployReader(mangrove: Address) {
  const tx = await client.deployContract({
    bytecode: readerBytecode,
    abi: readerAbi,
    args: [mangrove],
  });
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  if (!receipt.contractAddress) {
    throw new Error("Reader deployment failed");
  }
  console.log("Reader: ", receipt.contractAddress);
  return receipt.contractAddress;
}

async function deployKandelSeeder(mangrove: Address) {
  const kandelLibTx = await client.deployContract({
    bytecode: kandelLibBytecode,
    abi: [],
  });
  const kandelLibReceipt = await client.waitForTransactionReceipt({
    hash: kandelLibTx,
  });
  if (!kandelLibReceipt.contractAddress) {
    throw new Error("KandelLib deployment failed");
  }
  const bytecode = seederBytecode.replace(
    /__\$[a-fA-F0-9]{34}\$__/g,
    kandelLibReceipt.contractAddress.slice(2)
  ) as Hex;
  const seederTx = await client.deployContract({
    bytecode,
    abi: kandelSeederABI,
    args: [mangrove, 128_000n],
  });
  const seederReceipt = await client.waitForTransactionReceipt({
    hash: seederTx,
  });
  if (!seederReceipt.contractAddress) {
    throw new Error("Seeder deployment failed");
  }
  console.log("Seeder: ", seederReceipt.contractAddress);
  return seederReceipt.contractAddress;
}

async function deployToken(name: string, symbol: string, decimals: number) {
  const tx = await client.deployContract({
    bytecode: erc20,
    abi: erc20Abi,
    args: [name, symbol, decimals],
  });
  const receipt = await client.waitForTransactionReceipt({ hash: tx });
  if (!receipt.contractAddress) {
    throw new Error("Token deployment failed");
  }
  console.log(`${symbol}:`, receipt.contractAddress);
  return receipt.contractAddress;
}

async function openMarket(
  mangrove: Address,
  reader: Address,
  base: Address,
  quote: Address,
  minBaseVolume: bigint,
  minQuoteVolume: bigint,
  fee: bigint = 1n,
  gasBase: bigint = 250_000n
) {
  const tx1 = await client.writeContract({
    address: mangrove,
    abi: MangroveABI,
    functionName: "activate",
    args: [
      {
        outbound_tkn: base,
        inbound_tkn: quote,
        tickSpacing: 1n,
      },
      fee,
      floatToFixed96x32(Number(minBaseVolume) / 500_000),
      gasBase,
    ],
  });
  const tx2 = await client.writeContract({
    address: mangrove,
    abi: MangroveABI,
    functionName: "activate",
    args: [
      {
        outbound_tkn: quote,
        inbound_tkn: base,
        tickSpacing: 1n,
      },
      fee,
      floatToFixed96x32(Number(minQuoteVolume) / 500_000),
      gasBase,
    ],
  });
  const tx3 = await client.writeContract({
    address: reader,
    abi: readerAbi,
    functionName: "updateMarket",
    args: [
      {
        tkn0: base,
        tkn1: quote,
        tickSpacing: 1n,
      },
    ],
  });
  console.log("openned market");
  return { tx1, tx2, tx3 };
}

async function mintToken(token: Address, amount: bigint) {
  const tx = await client.writeContract({
    address: token,
    abi: erc20Abi,
    functionName: "mint",
    args: [client.account.address, amount],
  });
  console.log("minted token");
  return tx;
}

async function main() {
  const mangrove = await deployMangrove();
  const reader = await deployReader(mangrove);
  const seeder = await deployKandelSeeder(mangrove);
  const token0 = await deployToken("Wrapped Ether", "WETH", 18);
  const token1 = await deployToken("USDC", "USDC", 6);
  const token2 = await deployToken("BlahBLah", "BKC", 18);
  const token3 = await deployToken("choot", "chu", 18);
  await openMarket(
    mangrove,
    reader,
    token0,
    token1,
    parseUnits("0.001", 18),
    parseUnits("1", 6)
  );
  await openMarket(
    mangrove,
    reader,
    token2,
    token3,
    parseUnits("1", 18),
    parseUnits("1", 18)
  );
    await mintToken(token0, parseUnits("100", 18));
    await mintToken(token1, parseUnits("1000", 6));
    await mintToken(token2, parseUnits("1000", 18));
    await mintToken(token3, parseUnits("1100", 18));
}

main().then(() => {
  console.log("done");
});

process.on("SIGINT", async () => {
  console.log("Stopping anvil");
  await instance.stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Stopping anvil");
  await instance.stop();
  process.exit(0);
});
