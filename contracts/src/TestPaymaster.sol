// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPaymaster} from "account-abstraction/interfaces/IPaymaster.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

/**
 * A simple paymaster that sponsors gas for whitelisted wallets.
 * ERC-4337 v0.7 compliant.
 */
contract TestPaymaster is IPaymaster {
    address public owner;
    address public immutable entryPoint;

    mapping(address => bool) public whitelist;

    event Deposited(address indexed from, uint256 amount);
    event WhitelistUpdated(address indexed account, bool status);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "not from EntryPoint");
        _;
    }

    constructor(address _entryPoint) {
        owner = msg.sender;
        entryPoint = _entryPoint;
    }

    function addToWhitelist(address account) external onlyOwner {
        whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }

    function removeFromWhitelist(address account) external onlyOwner {
        whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }

    function addBatchToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
            emit WhitelistUpdated(accounts[i], true);
        }
    }

    /// @notice ERC-4337 v0.7 validatePaymasterUserOp with PackedUserOperation
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32, /* userOpHash */
        uint256 maxCost
    ) external onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        // Check sender is whitelisted (or sponsor all in testnet mode)
        // In production, enforce whitelist:
        // require(whitelist[userOp.sender], "paymaster: sender not whitelisted");

        require(
            IEntryPoint(entryPoint).balanceOf(address(this)) >= maxCost,
            "paymaster: insufficient deposit"
        );

        return (abi.encode(userOp.sender, maxCost), 0);
    }

    /// @notice ERC-4337 v0.7 postOp
    function postOp(
        IPaymaster.PostOpMode, /* mode */
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) external onlyEntryPoint {
        (, uint256 maxCost) = abi.decode(context, (address, uint256));
        require(actualGasCost <= maxCost, "gas cost exceeded");
    }

    /// @notice Deposit ETH into the EntryPoint on behalf of this paymaster
    function deposit() external payable {
        IEntryPoint(entryPoint).depositTo{value: msg.value}(address(this));
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from EntryPoint deposit
    function withdrawFromEntryPoint(address payable to, uint256 amount) external onlyOwner {
        IEntryPoint(entryPoint).withdrawTo(to, amount);
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "withdraw failed");
    }

    function getDeposit() public view returns (uint256) {
        return IEntryPoint(entryPoint).balanceOf(address(this));
    }

    receive() external payable {}
}
