// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SimpleAccount.sol";

/**
 * Factory for creating SimpleAccount instances using CREATE2 (deterministic addresses).
 * Uses EIP-1167 minimal proxy pattern for gas efficiency.
 */
contract SimpleAccountFactory {
    address public immutable accountImplementation;
    address public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(address _entryPoint) {
        entryPoint = _entryPoint;
        accountImplementation = address(new SimpleAccount(_entryPoint));
    }

    function createAccount(address owner, uint256 salt) external returns (address) {
        address addr = getAddress(owner, salt);
        if (addr.code.length > 0) {
            return addr;
        }

        // Deploy minimal proxy (EIP-1167)
        bytes memory bytecode = _getCreationBytecode();
        bytes32 saltHash = keccak256(abi.encodePacked(owner, salt));

        address account;
        assembly {
            account := create2(0, add(bytecode, 32), mload(bytecode), saltHash)
        }
        require(account != address(0), "create2 failed");

        SimpleAccount(payable(account)).initialize(owner);

        emit AccountCreated(account, owner, salt);
        return account;
    }

    function getAddress(address owner, uint256 salt) public view returns (address) {
        bytes32 saltHash = keccak256(abi.encodePacked(owner, salt));
        bytes memory bytecode = _getCreationBytecode();
        bytes32 hash = keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            saltHash,
            keccak256(bytecode)
        ));
        return address(uint160(uint256(hash)));
    }

    function _getCreationBytecode() internal view returns (bytes memory) {
        // EIP-1167 minimal proxy bytecode
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            accountImplementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
}
