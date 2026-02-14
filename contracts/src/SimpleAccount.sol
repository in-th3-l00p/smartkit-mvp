// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * A simple ERC-4337 smart account.
 * Validates UserOperations via ECDSA signature from an owner.
 * Supports execute/executeBatch for calling other contracts.
 */
contract SimpleAccount {
    address public owner;
    address public immutable entryPoint;
    bool private _initialized;

    event SimpleAccountInitialized(address indexed entryPoint, address indexed owner);
    event Executed(address indexed target, uint256 value, bytes data);

    modifier onlyOwnerOrEntryPoint() {
        require(msg.sender == owner || msg.sender == entryPoint, "not authorized");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "not from EntryPoint");
        _;
    }

    constructor(address _entryPoint) {
        entryPoint = _entryPoint;
        _initialized = true; // prevent init on implementation
    }

    function initialize(address _owner) external {
        require(!_initialized, "already initialized");
        require(_owner != address(0), "invalid owner");
        owner = _owner;
        _initialized = true;
        emit SimpleAccountInitialized(entryPoint, _owner);
    }

    function execute(address target, uint256 value, bytes calldata data) external onlyOwnerOrEntryPoint {
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, string(result));
        emit Executed(target, value, data);
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwnerOrEntryPoint {
        require(targets.length == values.length && values.length == datas.length, "length mismatch");
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);
            require(success, string(result));
            emit Executed(targets[i], values[i], datas[i]);
        }
    }

    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external onlyEntryPoint returns (uint256 validationData) {
        // Extract signature from userOp (last field)
        bytes memory signature = _extractSignature(userOp);

        // Verify ECDSA signature
        bytes32 ethSignedHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", userOpHash));
        address recovered = _recoverSigner(ethSignedHash, signature);

        if (recovered != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }

        // Pay prefund
        if (missingAccountFunds > 0) {
            (bool success,) = payable(entryPoint).call{value: missingAccountFunds}("");
            require(success, "prefund failed");
        }

        return 0; // SIG_VALIDATION_SUCCESS
    }

    function _extractSignature(bytes calldata userOp) internal pure returns (bytes memory) {
        // Simplified: assume signature is the entire userOp for MVP
        return userOp;
    }

    function _recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(hash, v, r, s);
    }

    function getDeposit() public view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
