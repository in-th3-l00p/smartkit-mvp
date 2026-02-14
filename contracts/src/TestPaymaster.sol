// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * A simple paymaster that sponsors gas for whitelisted wallets.
 * For testnet/MVP use only.
 */
contract TestPaymaster {
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

    function validatePaymasterUserOp(
        bytes calldata, /* userOp */
        bytes32, /* userOpHash */
        uint256 maxCost
    ) external onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        // For MVP: sponsor all transactions (or check whitelist)
        // In production, add proper validation
        require(address(this).balance >= maxCost, "paymaster: insufficient balance");
        return (abi.encode(maxCost), 0);
    }

    function postOp(
        uint8, /* mode */
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) external onlyEntryPoint {
        uint256 maxCost = abi.decode(context, (uint256));
        require(actualGasCost <= maxCost, "gas cost exceeded");
    }

    function deposit() external payable {
        (bool success,) = payable(entryPoint).call{value: msg.value}("");
        require(success, "deposit failed");
        emit Deposited(msg.sender, msg.value);
    }

    function withdrawTo(address payable to, uint256 amount) external onlyOwner {
        (bool success,) = to.call{value: amount}("");
        require(success, "withdraw failed");
    }

    receive() external payable {}
}
