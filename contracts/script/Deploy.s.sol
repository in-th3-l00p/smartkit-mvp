// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Deployment script for Foundry
// Usage: forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast

contract DeployScript {
    // ERC-4337 EntryPoint v0.7 on Base Sepolia
    address constant ENTRY_POINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        // Deploy using forge script with --broadcast flag
        // vm.startBroadcast();
        // SimpleAccountFactory factory = new SimpleAccountFactory(ENTRY_POINT);
        // TestPaymaster paymaster = new TestPaymaster(ENTRY_POINT);
        // vm.stopBroadcast();

        // Log addresses for configuration
        // console.log("Factory:", address(factory));
        // console.log("Paymaster:", address(paymaster));
    }
}
