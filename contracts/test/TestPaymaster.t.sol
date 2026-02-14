// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/TestPaymaster.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {IPaymaster} from "account-abstraction/interfaces/IPaymaster.sol";
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";

// Mock EntryPoint for testing paymaster deposit/balance
contract MockEntryPoint {
    mapping(address => uint256) public deposits;

    function balanceOf(address account) external view returns (uint256) {
        return deposits[account];
    }

    function depositTo(address account) external payable {
        deposits[account] += msg.value;
    }

    function withdrawTo(address payable to, uint256 amount) external {
        deposits[msg.sender] -= amount;
        (bool success,) = to.call{value: amount}("");
        require(success);
    }

    receive() external payable {}
}

contract TestPaymasterTest is Test {
    TestPaymaster paymaster;
    MockEntryPoint mockEntryPoint;
    address owner;
    address user;
    address attacker;

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");
        attacker = makeAddr("attacker");

        mockEntryPoint = new MockEntryPoint();
        paymaster = new TestPaymaster(address(mockEntryPoint));
    }

    // --- Whitelist Tests ---

    function test_add_to_whitelist() public {
        paymaster.addToWhitelist(user);
        assertTrue(paymaster.whitelist(user));
    }

    function test_remove_from_whitelist() public {
        paymaster.addToWhitelist(user);
        paymaster.removeFromWhitelist(user);
        assertFalse(paymaster.whitelist(user));
    }

    function test_batch_whitelist() public {
        address[] memory accounts = new address[](3);
        accounts[0] = makeAddr("a");
        accounts[1] = makeAddr("b");
        accounts[2] = makeAddr("c");

        paymaster.addBatchToWhitelist(accounts);

        assertTrue(paymaster.whitelist(accounts[0]));
        assertTrue(paymaster.whitelist(accounts[1]));
        assertTrue(paymaster.whitelist(accounts[2]));
    }

    function test_only_owner_can_whitelist() public {
        vm.prank(attacker);
        vm.expectRevert("not owner");
        paymaster.addToWhitelist(user);
    }

    function test_only_owner_can_remove_whitelist() public {
        vm.prank(attacker);
        vm.expectRevert("not owner");
        paymaster.removeFromWhitelist(user);
    }

    // --- Deposit Tests ---

    function test_deposit() public {
        paymaster.deposit{value: 1 ether}();
        assertEq(paymaster.getDeposit(), 1 ether);
    }

    function test_get_deposit_reflects_entrypoint() public {
        paymaster.deposit{value: 0.5 ether}();
        assertEq(paymaster.getDeposit(), 0.5 ether);

        paymaster.deposit{value: 0.5 ether}();
        assertEq(paymaster.getDeposit(), 1 ether);
    }

    // --- Validate Paymaster UserOp Tests ---

    function test_validate_paymaster_op_with_sufficient_balance() public {
        paymaster.deposit{value: 1 ether}();

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: user,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: ""
        });

        vm.prank(address(mockEntryPoint));
        (bytes memory context, uint256 validationData) = paymaster
            .validatePaymasterUserOp(userOp, bytes32(0), 0.5 ether);

        assertEq(validationData, 0, "should validate successfully");
        (address sender, uint256 maxCost) = abi.decode(context, (address, uint256));
        assertEq(sender, user);
        assertEq(maxCost, 0.5 ether);
    }

    function test_validate_paymaster_op_insufficient_balance() public {
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: user,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: ""
        });

        vm.prank(address(mockEntryPoint));
        vm.expectRevert("paymaster: insufficient deposit");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 1 ether);
    }

    function test_validate_paymaster_only_entrypoint() public {
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: user,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: ""
        });

        vm.prank(attacker);
        vm.expectRevert("not from EntryPoint");
        paymaster.validatePaymasterUserOp(userOp, bytes32(0), 0);
    }

    // --- PostOp Tests ---

    function test_post_op_within_max_cost() public {
        bytes memory context = abi.encode(user, 1 ether);

        vm.prank(address(mockEntryPoint));
        paymaster.postOp(IPaymaster.PostOpMode.opSucceeded, context, 0.5 ether, 0);
    }

    function test_post_op_exceeds_max_cost() public {
        bytes memory context = abi.encode(user, 0.5 ether);

        vm.prank(address(mockEntryPoint));
        vm.expectRevert("gas cost exceeded");
        paymaster.postOp(IPaymaster.PostOpMode.opSucceeded, context, 1 ether, 0);
    }

    function test_post_op_only_entrypoint() public {
        bytes memory context = abi.encode(user, 1 ether);

        vm.prank(attacker);
        vm.expectRevert("not from EntryPoint");
        paymaster.postOp(IPaymaster.PostOpMode.opSucceeded, context, 0, 0);
    }

    // --- Withdraw Tests ---

    function test_withdraw_to() public {
        vm.deal(address(paymaster), 1 ether);
        address payable recipient = payable(makeAddr("recipient"));

        paymaster.withdrawTo(recipient, 0.5 ether);
        assertEq(recipient.balance, 0.5 ether);
    }

    function test_only_owner_can_withdraw() public {
        vm.deal(address(paymaster), 1 ether);

        vm.prank(attacker);
        vm.expectRevert("not owner");
        paymaster.withdrawTo(payable(attacker), 1 ether);
    }

    // --- Receive ETH ---

    function test_can_receive_eth() public {
        (bool success,) = payable(address(paymaster)).call{value: 1 ether}("");
        assertTrue(success);
    }
}
