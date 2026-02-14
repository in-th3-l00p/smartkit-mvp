// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";

/**
 * Session Key Validator Module for SimpleAccount.
 * Allows temporary keys with restricted permissions:
 * - Target whitelist (which contracts can be called)
 * - Value limits (max ETH per call)
 * - Expiry (session keys are time-limited)
 */
contract SessionKeyValidator {
    struct SessionKey {
        address key;           // Session key address
        address[] targets;     // Allowed target contracts
        uint256 valueLimit;    // Max value per call (in wei)
        uint48 validAfter;     // Key is valid after this timestamp
        uint48 validUntil;     // Key expires at this timestamp
        bool active;           // Can be revoked by owner
    }

    // account => session key hash => SessionKey
    mapping(address => mapping(bytes32 => SessionKey)) public sessionKeys;
    // account => list of session key hashes (for enumeration)
    mapping(address => bytes32[]) public accountSessionKeys;

    event SessionKeyCreated(
        address indexed account,
        address indexed key,
        bytes32 indexed keyHash,
        uint48 validUntil
    );
    event SessionKeyRevoked(address indexed account, bytes32 indexed keyHash);

    function createSessionKey(
        address key,
        address[] calldata targets,
        uint256 valueLimit,
        uint48 validAfter,
        uint48 validUntil
    ) external returns (bytes32 keyHash) {
        require(key != address(0), "invalid key");
        require(validUntil > block.timestamp, "already expired");
        require(validUntil > validAfter, "invalid time range");
        require(targets.length > 0, "no targets");

        keyHash = keccak256(abi.encodePacked(msg.sender, key));

        SessionKey storage sk = sessionKeys[msg.sender][keyHash];
        sk.key = key;
        sk.targets = targets;
        sk.valueLimit = valueLimit;
        sk.validAfter = validAfter;
        sk.validUntil = validUntil;
        sk.active = true;

        accountSessionKeys[msg.sender].push(keyHash);

        emit SessionKeyCreated(msg.sender, key, keyHash, validUntil);
    }

    function revokeSessionKey(bytes32 keyHash) external {
        SessionKey storage sk = sessionKeys[msg.sender][keyHash];
        require(sk.active, "key not active");
        sk.active = false;
        emit SessionKeyRevoked(msg.sender, keyHash);
    }

    function validateSessionKey(
        address account,
        address signer,
        address target,
        uint256 value
    ) external view returns (bool valid) {
        bytes32 keyHash = keccak256(abi.encodePacked(account, signer));
        SessionKey storage sk = sessionKeys[account][keyHash];

        if (!sk.active) return false;
        if (block.timestamp < sk.validAfter) return false;
        if (block.timestamp > sk.validUntil) return false;
        if (value > sk.valueLimit) return false;

        // Check target whitelist
        bool targetAllowed = false;
        for (uint256 i = 0; i < sk.targets.length; i++) {
            if (sk.targets[i] == target) {
                targetAllowed = true;
                break;
            }
        }
        if (!targetAllowed) return false;

        return true;
    }

    function getSessionKey(
        address account,
        bytes32 keyHash
    ) external view returns (
        address key,
        uint256 valueLimit,
        uint48 validAfter,
        uint48 validUntil,
        bool active
    ) {
        SessionKey storage sk = sessionKeys[account][keyHash];
        return (sk.key, sk.valueLimit, sk.validAfter, sk.validUntil, sk.active);
    }

    function getSessionKeyTargets(
        address account,
        bytes32 keyHash
    ) external view returns (address[] memory) {
        return sessionKeys[account][keyHash].targets;
    }

    function getAccountSessionKeyCount(address account) external view returns (uint256) {
        return accountSessionKeys[account].length;
    }
}
