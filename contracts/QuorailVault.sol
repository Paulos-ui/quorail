// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title QuorailVault
 * @notice Single-owner, single-agent testnet treasury with non-bypassable limits.
 * @dev USDC uses six ERC20 decimals. Only the owner can approve escalated payments.
 *      The agent cannot change policy, beneficiaries, signer or pause state.
 *      Owner should use a separate hardware-backed wallet for production.
 */
interface IERC20Quorail {
    function transfer(address to, uint256 value) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

contract QuorailVault {
    address public immutable owner;
    address public agent;
    IERC20Quorail public immutable usdc;
    uint256 public autonomousLimit;
    uint256 public singleLimit;
    uint256 public dailyLimit;
    bool public paused;
    uint256 public lastDay;
    uint256 public spentToday;
    bool private entered;
    mapping(address => bool) public allowedRecipients;
    mapping(bytes32 => bool) public completedPayments;
    mapping(bytes32 => bytes32) public approvedPayments;

    event PaymentExecuted(bytes32 indexed paymentId, address indexed recipient, uint256 amount);
    event ApprovalGranted(bytes32 indexed paymentId, address indexed recipient, uint256 amount);
    event PolicyChanged(uint256 autonomousLimit, uint256 singleLimit, uint256 dailyLimit);
    event RecipientUpdated(address indexed recipient, bool allowed);
    event AgentUpdated(address indexed agent);
    event PauseUpdated(bool paused);
    event OwnerWithdrawal(address indexed recipient, uint256 amount);

    error Unauthorized(); error BadPolicy(); error NotAllowed(); error Duplicate();
    error LimitExceeded(); error TransferFailed(); error Reentrant();

    modifier onlyOwner() { if (msg.sender != owner) revert Unauthorized(); _; }
    modifier guard() { if (entered) revert Reentrant(); entered = true; _; entered = false; }

    constructor(address token, address initialAgent, uint256 autonomousCap, uint256 singleCap, uint256 dailyCap) {
        if (token == address(0) || initialAgent == address(0)) revert BadPolicy();
        owner = msg.sender; usdc = IERC20Quorail(token); agent = initialAgent;
        _setPolicy(autonomousCap, singleCap, dailyCap);
    }

    function _setPolicy(uint256 autoCap, uint256 maxSingle, uint256 maxDaily) internal {
        if (autoCap == 0 || autoCap > maxSingle || maxSingle > maxDaily) revert BadPolicy();
        autonomousLimit = autoCap; singleLimit = maxSingle; dailyLimit = maxDaily;
        emit PolicyChanged(autoCap, maxSingle, maxDaily);
    }
    function setPolicy(uint256 autoCap, uint256 maxSingle, uint256 maxDaily) external onlyOwner {
        _setPolicy(autoCap, maxSingle, maxDaily);
    }
    function setAgent(address newAgent) external onlyOwner {
        if (newAgent == address(0)) revert BadPolicy();
        agent = newAgent; emit AgentUpdated(newAgent);
    }
    function setRecipient(address recipient, bool allowed) external onlyOwner {
        if (recipient == address(0)) revert BadPolicy();
        allowedRecipients[recipient] = allowed; emit RecipientUpdated(recipient, allowed);
    }
    function setPaused(bool value) external onlyOwner { paused = value; emit PauseUpdated(value); }

    /** Approval cannot be repurposed for a different recipient or amount. */
    function approvePayment(bytes32 paymentId, address recipient, uint256 amount) external onlyOwner {
        if (completedPayments[paymentId] || !allowedRecipients[recipient] || amount == 0 || amount > singleLimit) revert NotAllowed();
        approvedPayments[paymentId] = keccak256(abi.encode(recipient, amount));
        emit ApprovalGranted(paymentId, recipient, amount);
    }

    /** Anyone else, including the owner, cannot call pay(). */
    function pay(address recipient, uint256 amount, bytes32 paymentId) external guard {
        if (msg.sender != agent) revert Unauthorized();
        if (paused || !allowedRecipients[recipient]) revert NotAllowed();
        if (amount == 0 || amount > singleLimit) revert LimitExceeded();
        if (completedPayments[paymentId]) revert Duplicate();
        if (amount > autonomousLimit) {
            if (approvedPayments[paymentId] != keccak256(abi.encode(recipient, amount))) revert Unauthorized();
            delete approvedPayments[paymentId];
        }
        uint256 day = block.timestamp / 1 days;
        if (day != lastDay) { lastDay = day; spentToday = 0; }
        if (spentToday + amount > dailyLimit) revert LimitExceeded();
        spentToday += amount;
        completedPayments[paymentId] = true;
        if (!usdc.transfer(recipient, amount)) revert TransferFailed();
        emit PaymentExecuted(paymentId, recipient, amount);
    }
    /** Emergency recovery by the OWNER only; does not grant agent more authority. */
    function ownerWithdraw(address recipient, uint256 amount) external onlyOwner guard {
        if (recipient == address(0) || amount == 0) revert BadPolicy();
        if (!usdc.transfer(recipient, amount)) revert TransferFailed();
        emit OwnerWithdrawal(recipient, amount);
    }
    function vaultBalance() external view returns (uint256) { return usdc.balanceOf(address(this)); }
}
