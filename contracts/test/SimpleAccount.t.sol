// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SimpleAccount.sol";
import "../src/SimpleAccountFactory.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

contract SimpleAccountTest is Test {
    SimpleAccount implementation;
    SimpleAccountFactory factory;
    address entryPoint;
    address owner;
    uint256 ownerKey;
    address attacker;

    function setUp() public {
        entryPoint = makeAddr("entryPoint");
        (owner, ownerKey) = makeAddrAndKey("owner");
        attacker = makeAddr("attacker");

        factory = new SimpleAccountFactory(entryPoint);
        implementation = SimpleAccount(payable(factory.accountImplementation()));
    }

    // --- Factory Tests ---

    function test_factory_creates_account() public {
        address account = factory.createAccount(owner, 0);
        assertTrue(account != address(0), "account should not be zero");
        assertEq(SimpleAccount(payable(account)).owner(), owner);
    }

    function test_factory_deterministic_address() public {
        address predicted = factory.getAddress(owner, 0);
        address created = factory.createAccount(owner, 0);
        assertEq(predicted, created, "predicted address should match");
    }

    function test_factory_returns_existing_on_duplicate() public {
        address first = factory.createAccount(owner, 0);
        address second = factory.createAccount(owner, 0);
        assertEq(first, second, "should return same address");
    }

    function test_factory_different_salt_different_address() public {
        address a = factory.getAddress(owner, 0);
        address b = factory.getAddress(owner, 1);
        assertTrue(a != b, "different salts should give different addresses");
    }

    function test_factory_different_owner_different_address() public {
        address a = factory.getAddress(owner, 0);
        address b = factory.getAddress(attacker, 0);
        assertTrue(a != b, "different owners should give different addresses");
    }

    // --- Initialization Tests ---

    function test_implementation_cannot_be_reinitialized() public {
        vm.expectRevert("already initialized");
        implementation.initialize(owner);
    }

    function test_proxy_initialized_after_create() public {
        address account = factory.createAccount(owner, 0);
        vm.expectRevert("already initialized");
        SimpleAccount(payable(account)).initialize(attacker);
    }

    // --- Execute Tests ---

    function test_owner_can_execute() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 1 ether);

        address target = makeAddr("target");
        vm.prank(owner);
        SimpleAccount(payable(account)).execute(target, 0.5 ether, "");

        assertEq(target.balance, 0.5 ether);
    }

    function test_entrypoint_can_execute() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 1 ether);

        address target = makeAddr("target");
        vm.prank(entryPoint);
        SimpleAccount(payable(account)).execute(target, 0.5 ether, "");

        assertEq(target.balance, 0.5 ether);
    }

    function test_attacker_cannot_execute() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 1 ether);

        vm.prank(attacker);
        vm.expectRevert("not authorized");
        SimpleAccount(payable(account)).execute(attacker, 1 ether, "");
    }

    // --- ExecuteBatch Tests ---

    function test_execute_batch() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 2 ether);

        address target1 = makeAddr("target1");
        address target2 = makeAddr("target2");

        address[] memory targets = new address[](2);
        targets[0] = target1;
        targets[1] = target2;

        uint256[] memory values = new uint256[](2);
        values[0] = 0.5 ether;
        values[1] = 0.3 ether;

        bytes[] memory datas = new bytes[](2);
        datas[0] = "";
        datas[1] = "";

        vm.prank(owner);
        SimpleAccount(payable(account)).executeBatch(targets, values, datas);

        assertEq(target1.balance, 0.5 ether);
        assertEq(target2.balance, 0.3 ether);
    }

    function test_execute_batch_length_mismatch() public {
        address account = factory.createAccount(owner, 0);

        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](1);
        bytes[] memory datas = new bytes[](2);

        vm.prank(owner);
        vm.expectRevert("length mismatch");
        SimpleAccount(payable(account)).executeBatch(targets, values, datas);
    }

    // --- ValidateUserOp Tests ---

    function test_validate_user_op_valid_signature() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 1 ether);

        bytes32 userOpHash = keccak256("test");

        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: account,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: signature
        });

        vm.prank(entryPoint);
        uint256 result = SimpleAccount(payable(account)).validateUserOp(
            userOp,
            userOpHash,
            0
        );
        assertEq(result, 0, "should return SIG_VALIDATION_SUCCESS");
    }

    function test_validate_user_op_invalid_signature() public {
        address account = factory.createAccount(owner, 0);

        bytes32 userOpHash = keccak256("test");

        (, uint256 attackerKey) = makeAddrAndKey("attacker2");
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: account,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: signature
        });

        vm.prank(entryPoint);
        uint256 result = SimpleAccount(payable(account)).validateUserOp(
            userOp,
            userOpHash,
            0
        );
        assertEq(result, 1, "should return SIG_VALIDATION_FAILED");
    }

    function test_validate_user_op_pays_prefund() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 1 ether);

        bytes32 userOpHash = keccak256("test");
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: account,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: signature
        });

        uint256 prefund = 0.01 ether;
        uint256 epBalanceBefore = entryPoint.balance;

        vm.prank(entryPoint);
        SimpleAccount(payable(account)).validateUserOp(userOp, userOpHash, prefund);

        assertEq(entryPoint.balance, epBalanceBefore + prefund);
    }

    function test_validate_user_op_only_entrypoint() public {
        address account = factory.createAccount(owner, 0);

        PackedUserOperation memory userOp = PackedUserOperation({
            sender: account,
            nonce: 0,
            initCode: "",
            callData: "",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: "",
            signature: new bytes(65)
        });

        vm.prank(attacker);
        vm.expectRevert("not from EntryPoint");
        SimpleAccount(payable(account)).validateUserOp(userOp, bytes32(0), 0);
    }

    // --- Receive ETH ---

    function test_can_receive_eth() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(address(this), 1 ether);
        (bool success,) = payable(account).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(account.balance, 1 ether);
    }

    function test_get_deposit() public {
        address account = factory.createAccount(owner, 0);
        vm.deal(account, 2 ether);
        assertEq(SimpleAccount(payable(account)).getDeposit(), 2 ether);
    }
}
