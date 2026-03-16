// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract VeilPayManager {
    enum EntryKind {
        Payout,
        Payroll,
        Grant,
        Reimbursement,
        Invoice
    }

    enum PayoutStatus {
        Pending,
        Claimed,
        Cancelled
    }

    struct PayoutSummary {
        uint256 id;
        uint256 batchId;
        address creator;
        address recipient;
        address settlementToken;
        bytes32 metadataHash;
        EntryKind kind;
        PayoutStatus status;
        uint64 dueDate;
        uint64 createdAt;
    }

    struct BatchSummary {
        uint256 id;
        address creator;
        address settlementToken;
        bytes32 metadataHash;
        EntryKind kind;
        uint64 dueDate;
        uint64 createdAt;
        uint32 itemCount;
    }

    struct StoredPayout {
        uint256 batchId;
        address creator;
        address recipient;
        address settlementToken;
        bytes32 metadataHash;
        EntryKind kind;
        PayoutStatus status;
        uint64 dueDate;
        uint64 createdAt;
        euint64 amount;
    }

    euint64 public ZERO_AMOUNT;
    uint256 public nextPayoutId = 1;
    uint256 public nextBatchId = 1;

    mapping(uint256 => StoredPayout) private payouts;
    mapping(address => uint256[]) private creatorPayoutIds;
    mapping(address => uint256[]) private recipientPayoutIds;
    mapping(address => uint256[]) private viewerPayoutIds;
    mapping(uint256 => mapping(address => bool)) public viewerAuthorized;
    mapping(uint256 => uint256[]) private batchPayoutIds;
    mapping(uint256 => BatchSummary) private batches;

    event PayoutCreated(
        uint256 indexed payoutId,
        uint256 indexed batchId,
        address indexed creator,
        address recipient,
        EntryKind kind,
        uint64 dueDate,
        bytes32 metadataHash,
        address settlementToken
    );
    event BatchCreated(
        uint256 indexed batchId,
        address indexed creator,
        EntryKind kind,
        uint32 itemCount,
        uint64 dueDate,
        bytes32 metadataHash,
        address settlementToken
    );
    event PayoutClaimed(uint256 indexed payoutId, address indexed recipient);
    event PayoutCancelled(uint256 indexed payoutId, address indexed creator);
    event PayoutAccessGranted(
        uint256 indexed payoutId,
        address indexed creator,
        address indexed viewer
    );

    error EmptyBatch();
    error InvalidArrayLengths();
    error InvalidKind();
    error NotCreator();
    error NotPending();
    error NotRecipient();
    error PayoutNotFound();
    error ZeroAddressRecipient();

    constructor() {
        ZERO_AMOUNT = FHE.asEuint64(0);
        FHE.allowThis(ZERO_AMOUNT);
    }

    function createConfidentialPayout(
        address recipient,
        InEuint64 calldata encryptedAmount,
        bytes32 metadataHash,
        address settlementToken,
        uint64 dueDate,
        EntryKind kind
    ) external returns (uint256 payoutId) {
        if (recipient == address(0)) revert ZeroAddressRecipient();
        if (uint8(kind) > uint8(EntryKind.Invoice)) revert InvalidKind();

        payoutId = _createPayout(
            msg.sender,
            recipient,
            encryptedAmount,
            metadataHash,
            settlementToken,
            dueDate,
            kind,
            0
        );
    }

    function createBatchPayouts(
        address[] calldata recipients,
        InEuint64[] calldata encryptedAmounts,
        bytes32[] calldata metadataHashes,
        address settlementToken,
        uint64 dueDate,
        EntryKind kind,
        bytes32 batchMetadataHash
    ) external returns (uint256 batchId, uint256[] memory payoutIds) {
        uint256 itemCount = recipients.length;
        if (itemCount == 0) revert EmptyBatch();
        if (
            itemCount != encryptedAmounts.length ||
            itemCount != metadataHashes.length
        ) revert InvalidArrayLengths();
        if (uint8(kind) > uint8(EntryKind.Invoice)) revert InvalidKind();

        batchId = nextBatchId++;
        payoutIds = new uint256[](itemCount);

        batches[batchId] = BatchSummary({
            id: batchId,
            creator: msg.sender,
            settlementToken: settlementToken,
            metadataHash: batchMetadataHash,
            kind: kind,
            dueDate: dueDate,
            createdAt: uint64(block.timestamp),
            itemCount: uint32(itemCount)
        });

        emit BatchCreated(
            batchId,
            msg.sender,
            kind,
            uint32(itemCount),
            dueDate,
            batchMetadataHash,
            settlementToken
        );

        for (uint256 index = 0; index < itemCount; index++) {
            if (recipients[index] == address(0)) revert ZeroAddressRecipient();
            uint256 payoutId = _createPayout(
                msg.sender,
                recipients[index],
                encryptedAmounts[index],
                metadataHashes[index],
                settlementToken,
                dueDate,
                kind,
                batchId
            );

            payoutIds[index] = payoutId;
            batchPayoutIds[batchId].push(payoutId);
        }
    }

    function claimPayout(uint256 payoutId) external {
        StoredPayout storage payout = payouts[payoutId];
        if (payout.creator == address(0)) revert PayoutNotFound();
        if (msg.sender != payout.recipient) revert NotRecipient();
        if (payout.status != PayoutStatus.Pending) revert NotPending();

        payout.status = PayoutStatus.Claimed;
        emit PayoutClaimed(payoutId, msg.sender);
    }

    function cancelPayout(uint256 payoutId) external {
        StoredPayout storage payout = payouts[payoutId];
        if (payout.creator == address(0)) revert PayoutNotFound();
        if (msg.sender != payout.creator) revert NotCreator();
        if (payout.status != PayoutStatus.Pending) revert NotPending();

        payout.status = PayoutStatus.Cancelled;
        emit PayoutCancelled(payoutId, msg.sender);
    }

    function grantPayoutAccess(uint256 payoutId, address viewer) external {
        StoredPayout storage payout = payouts[payoutId];
        if (payout.creator == address(0)) revert PayoutNotFound();
        if (msg.sender != payout.creator) revert NotCreator();
        if (viewer == address(0)) revert ZeroAddressRecipient();

        if (!viewerAuthorized[payoutId][viewer]) {
            viewerAuthorized[payoutId][viewer] = true;
            viewerPayoutIds[viewer].push(payoutId);
        }

        FHE.allow(payout.amount, viewer);
        emit PayoutAccessGranted(payoutId, msg.sender, viewer);
    }

    function getPayoutSummary(
        uint256 payoutId
    ) external view returns (PayoutSummary memory) {
        StoredPayout storage payout = payouts[payoutId];
        if (payout.creator == address(0)) revert PayoutNotFound();

        return
            PayoutSummary({
                id: payoutId,
                batchId: payout.batchId,
                creator: payout.creator,
                recipient: payout.recipient,
                settlementToken: payout.settlementToken,
                metadataHash: payout.metadataHash,
                kind: payout.kind,
                status: payout.status,
                dueDate: payout.dueDate,
                createdAt: payout.createdAt
            });
    }

    function getPayoutAmountHandle(
        uint256 payoutId
    ) external view returns (euint64) {
        StoredPayout storage payout = payouts[payoutId];
        if (payout.creator == address(0)) revert PayoutNotFound();

        return payout.amount;
    }

    function getBatchSummary(
        uint256 batchId
    ) external view returns (BatchSummary memory) {
        BatchSummary memory summary = batches[batchId];
        if (summary.creator == address(0)) revert PayoutNotFound();
        return summary;
    }

    function getCreatorPayoutIds(
        address creator
    ) external view returns (uint256[] memory) {
        return creatorPayoutIds[creator];
    }

    function getRecipientPayoutIds(
        address recipient
    ) external view returns (uint256[] memory) {
        return recipientPayoutIds[recipient];
    }

    function getViewerPayoutIds(
        address viewer
    ) external view returns (uint256[] memory) {
        return viewerPayoutIds[viewer];
    }

    function getBatchPayoutIds(
        uint256 batchId
    ) external view returns (uint256[] memory) {
        return batchPayoutIds[batchId];
    }

    function totalPayoutsCreated() external view returns (uint256) {
        return nextPayoutId - 1;
    }

    function totalBatchesCreated() external view returns (uint256) {
        return nextBatchId - 1;
    }

    function _createPayout(
        address creator,
        address recipient,
        InEuint64 calldata encryptedAmount,
        bytes32 metadataHash,
        address settlementToken,
        uint64 dueDate,
        EntryKind kind,
        uint256 batchId
    ) internal returns (uint256 payoutId) {
        payoutId = nextPayoutId++;

        euint64 amount = FHE.asEuint64(encryptedAmount);
        FHE.allowThis(amount);
        FHE.allow(amount, creator);
        FHE.allow(amount, recipient);

        payouts[payoutId] = StoredPayout({
            batchId: batchId,
            creator: creator,
            recipient: recipient,
            settlementToken: settlementToken,
            metadataHash: metadataHash,
            kind: kind,
            status: PayoutStatus.Pending,
            dueDate: dueDate,
            createdAt: uint64(block.timestamp),
            amount: amount
        });

        creatorPayoutIds[creator].push(payoutId);
        recipientPayoutIds[recipient].push(payoutId);

        emit PayoutCreated(
            payoutId,
            batchId,
            creator,
            recipient,
            kind,
            dueDate,
            metadataHash,
            settlementToken
        );
    }
}
