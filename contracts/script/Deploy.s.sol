// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SimpleAccountFactory.sol";
import "../src/TestPaymaster.sol";

/**
 * Deployment script for SmartKit contracts.
 * Usage: forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify
 */
contract DeployScript is Script {
    // ERC-4337 EntryPoint v0.7 on Base Sepolia
    address constant ENTRY_POINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    // Amount to fund the paymaster (0.1 ETH)
    uint256 constant PAYMASTER_FUND = 0.1 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Factory (also deploys the implementation)
        SimpleAccountFactory factory = new SimpleAccountFactory(ENTRY_POINT);
        console.log("Factory deployed at:", address(factory));
        console.log("Account implementation:", factory.accountImplementation());

        // Deploy Paymaster
        TestPaymaster paymaster = new TestPaymaster(ENTRY_POINT);
        console.log("Paymaster deployed at:", address(paymaster));

        // Fund the paymaster's EntryPoint deposit
        paymaster.deposit{value: PAYMASTER_FUND}();
        console.log("Paymaster funded with:", PAYMASTER_FUND);
        console.log("Paymaster EntryPoint deposit:", paymaster.getDeposit());

        vm.stopBroadcast();

        // Output for .env configuration
        console.log("");
        console.log("=== Add to .env ===");
        console.log("NEXT_PUBLIC_FACTORY_ADDRESS=", address(factory));
        console.log("NEXT_PUBLIC_PAYMASTER_ADDRESS=", address(paymaster));
    }
}
