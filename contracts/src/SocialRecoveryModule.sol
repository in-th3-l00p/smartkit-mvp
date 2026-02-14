// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * Social Recovery Module for SimpleAccount.
 * M-of-N guardian recovery with 48-hour time lock.
 * Guardians can collectively vote to replace the account owner.
 */
contract SocialRecoveryModule {
    uint256 public constant RECOVERY_DELAY = 48 hours;

    struct RecoveryConfig {
        address[] guardians;
        uint256 threshold;     // M out of N
        bool configured;
    }

    struct RecoveryRequest {
        address newOwner;
        uint256 approvalCount;
        uint256 executeAfter;  // Timestamp when recovery can be finalized
        bool executed;
        mapping(address => bool) approvals;
    }

    // account => config
    mapping(address => RecoveryConfig) public configs;
    // account => recovery nonce => request
    mapping(address => mapping(uint256 => RecoveryRequest)) public requests;
    // account => current recovery nonce
    mapping(address => uint256) public recoveryNonce;

    event GuardiansConfigured(address indexed account, uint256 threshold, uint256 guardianCount);
    event RecoveryInitiated(address indexed account, uint256 indexed nonce, address newOwner, uint256 executeAfter);
    event RecoveryApproved(address indexed account, uint256 indexed nonce, address indexed guardian);
    event RecoveryExecuted(address indexed account, uint256 indexed nonce, address newOwner);
    event RecoveryCancelled(address indexed account, uint256 indexed nonce);

    modifier onlyAccount(address account) {
        require(msg.sender == account, "only account owner");
        _;
    }

    modifier onlyGuardian(address account) {
        RecoveryConfig storage config = configs[account];
        bool isGuardian = false;
        for (uint256 i = 0; i < config.guardians.length; i++) {
            if (config.guardians[i] == msg.sender) {
                isGuardian = true;
                break;
            }
        }
        require(isGuardian, "not a guardian");
        _;
    }

    /// @notice Configure guardians for an account (called by the account itself)
    function configureGuardians(
        address[] calldata guardians,
        uint256 threshold
    ) external {
        require(guardians.length >= threshold, "threshold too high");
        require(threshold > 0, "threshold must be > 0");
        require(guardians.length <= 10, "too many guardians");

        // Validate no duplicates and no zero addresses
        for (uint256 i = 0; i < guardians.length; i++) {
            require(guardians[i] != address(0), "invalid guardian");
            for (uint256 j = i + 1; j < guardians.length; j++) {
                require(guardians[i] != guardians[j], "duplicate guardian");
            }
        }

        RecoveryConfig storage config = configs[msg.sender];
        config.guardians = guardians;
        config.threshold = threshold;
        config.configured = true;

        emit GuardiansConfigured(msg.sender, threshold, guardians.length);
    }

    /// @notice Initiate recovery (called by any guardian)
    function initiateRecovery(
        address account,
        address newOwner
    ) external onlyGuardian(account) {
        require(configs[account].configured, "not configured");
        require(newOwner != address(0), "invalid new owner");

        uint256 nonce = recoveryNonce[account];
        RecoveryRequest storage req = requests[account][nonce];
        require(req.newOwner == address(0), "recovery already pending");

        req.newOwner = newOwner;
        req.approvalCount = 1;
        req.executeAfter = block.timestamp + RECOVERY_DELAY;
        req.approvals[msg.sender] = true;

        emit RecoveryInitiated(account, nonce, newOwner, req.executeAfter);
        emit RecoveryApproved(account, nonce, msg.sender);
    }

    /// @notice Approve a pending recovery
    function approveRecovery(address account) external onlyGuardian(account) {
        uint256 nonce = recoveryNonce[account];
        RecoveryRequest storage req = requests[account][nonce];

        require(req.newOwner != address(0), "no recovery pending");
        require(!req.executed, "already executed");
        require(!req.approvals[msg.sender], "already approved");

        req.approvals[msg.sender] = true;
        req.approvalCount++;

        emit RecoveryApproved(account, nonce, msg.sender);
    }

    /// @notice Execute recovery after time lock and threshold met
    function executeRecovery(address account) external {
        uint256 nonce = recoveryNonce[account];
        RecoveryRequest storage req = requests[account][nonce];
        RecoveryConfig storage config = configs[account];

        require(req.newOwner != address(0), "no recovery pending");
        require(!req.executed, "already executed");
        require(req.approvalCount >= config.threshold, "not enough approvals");
        require(block.timestamp >= req.executeAfter, "time lock not expired");

        req.executed = true;
        recoveryNonce[account] = nonce + 1;

        // The actual owner change must be called by the account contract
        // This emits the event; the caller should then update the account's owner
        emit RecoveryExecuted(account, nonce, req.newOwner);
    }

    /// @notice Cancel a pending recovery (only the current account owner)
    function cancelRecovery() external {
        uint256 nonce = recoveryNonce[msg.sender];
        RecoveryRequest storage req = requests[msg.sender][nonce];

        require(req.newOwner != address(0), "no recovery pending");
        require(!req.executed, "already executed");

        // Reset by incrementing nonce
        recoveryNonce[msg.sender] = nonce + 1;

        emit RecoveryCancelled(msg.sender, nonce);
    }

    /// @notice Get guardian list for an account
    function getGuardians(address account) external view returns (address[] memory) {
        return configs[account].guardians;
    }

    /// @notice Get recovery status
    function getRecoveryStatus(address account) external view returns (
        address newOwner,
        uint256 approvalCount,
        uint256 threshold,
        uint256 executeAfter,
        bool canExecute
    ) {
        uint256 nonce = recoveryNonce[account];
        RecoveryRequest storage req = requests[account][nonce];
        RecoveryConfig storage config = configs[account];

        newOwner = req.newOwner;
        approvalCount = req.approvalCount;
        threshold = config.threshold;
        executeAfter = req.executeAfter;
        canExecute = (
            req.newOwner != address(0) &&
            !req.executed &&
            req.approvalCount >= config.threshold &&
            block.timestamp >= req.executeAfter
        );
    }

    /// @notice Check if an address is a guardian
    function isGuardian(address account, address addr) external view returns (bool) {
        RecoveryConfig storage config = configs[account];
        for (uint256 i = 0; i < config.guardians.length; i++) {
            if (config.guardians[i] == addr) return true;
        }
        return false;
    }
}
