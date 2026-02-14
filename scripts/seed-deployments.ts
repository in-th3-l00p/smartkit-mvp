/**
 * Seed deployment records into Convex from environment variables.
 *
 * Usage:
 *   npx convex run scripts/seed-deployments
 *
 * Or run directly with ts-node / tsx:
 *   npx tsx scripts/seed-deployments.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL is required");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface DeploymentSeed {
  contractName: string;
  address: string;
  chainId: number;
  verified: boolean;
}

const deployments: DeploymentSeed[] = [
  // Base Sepolia
  {
    contractName: "SimpleAccountFactory",
    address: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "",
    chainId: 84532,
    verified: false,
  },
  {
    contractName: "VerifyingPaymaster",
    address: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS || "",
    chainId: 84532,
    verified: false,
  },
  // Arbitrum Sepolia
  {
    contractName: "SimpleAccountFactory",
    address: process.env.ARBITRUM_SEPOLIA_FACTORY_ADDRESS || "",
    chainId: 421614,
    verified: false,
  },
  {
    contractName: "VerifyingPaymaster",
    address: process.env.ARBITRUM_SEPOLIA_PAYMASTER_ADDRESS || "",
    chainId: 421614,
    verified: false,
  },
  // Optimism Sepolia
  {
    contractName: "SimpleAccountFactory",
    address: process.env.OP_SEPOLIA_FACTORY_ADDRESS || "",
    chainId: 11155420,
    verified: false,
  },
  {
    contractName: "VerifyingPaymaster",
    address: process.env.OP_SEPOLIA_PAYMASTER_ADDRESS || "",
    chainId: 11155420,
    verified: false,
  },
];

async function main() {
  console.log("Seeding deployment records...\n");

  for (const dep of deployments) {
    if (
      !dep.address ||
      dep.address === "0x0000000000000000000000000000000000000000"
    ) {
      console.log(
        `  SKIP ${dep.contractName} on chain ${dep.chainId} (no address configured)`
      );
      continue;
    }

    try {
      await client.mutation(api.deployments.seedDeployment as any, {
        contractName: dep.contractName,
        address: dep.address,
        chainId: dep.chainId,
        verified: dep.verified,
      });
      console.log(
        `  OK   ${dep.contractName} on chain ${dep.chainId} -> ${dep.address}`
      );
    } catch (error) {
      console.error(
        `  FAIL ${dep.contractName} on chain ${dep.chainId}:`,
        error
      );
    }
  }

  console.log("\nDone!");
}

main();
