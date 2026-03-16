import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { cofhejs, Encryptable, FheTypes } from "cofhejs/node";

describe("VeilPayManager", function () {
  async function deployFixture() {
    const [deployer, admin, recipient, recipientTwo, auditor, outsider] =
      await hre.ethers.getSigners();

    const VeilPayManager = await hre.ethers.getContractFactory(
      "VeilPayManager",
    );
    const manager = await VeilPayManager.connect(deployer).deploy();

    return {
      manager,
      admin,
      recipient,
      recipientTwo,
      auditor,
      outsider,
    };
  }

  async function initializeSigner(signer: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number]) {
    const initialized = await hre.cofhe.initializeWithHardhatSigner(signer);
    await hre.cofhe.expectResultSuccess(initialized);
  }

  async function encryptUint64(
    signer: Awaited<ReturnType<typeof hre.ethers.getSigners>>[number],
    value: bigint,
  ) {
    await initializeSigner(signer);
    const result = await cofhejs.encrypt([Encryptable.uint64(value)] as const);
    if (!result.success) {
      throw new Error(result.error.message);
    }

    return result.data[0];
  }

  beforeEach(function () {
    if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
  });

  it("creates a confidential payout with an encrypted amount handle", async function () {
    const { manager, admin, recipient } = await loadFixture(deployFixture);
    const dueDate = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const encryptedAmount = await encryptUint64(admin, 1_250_000n);

    await manager
      .connect(admin)
      .createConfidentialPayout(
        recipient.address,
        encryptedAmount,
        hre.ethers.id("metadata:single"),
        hre.ethers.ZeroAddress,
        dueDate,
        0,
      );

    const summary = await manager.getPayoutSummary(1);
    expect(summary.id).to.equal(1n);
    expect(summary.creator).to.equal(admin.address);
    expect(summary.recipient).to.equal(recipient.address);
    expect(summary.kind).to.equal(0n);
    expect(summary.status).to.equal(0n);

    const handle = await manager.getPayoutAmountHandle(1);
    await hre.cofhe.mocks.expectPlaintext(handle, 1_250_000n);
  });

  it("lets the recipient claim a payout", async function () {
    const { manager, admin, recipient } = await loadFixture(deployFixture);
    const encryptedAmount = await encryptUint64(admin, 725_000n);

    await manager
      .connect(admin)
      .createConfidentialPayout(
        recipient.address,
        encryptedAmount,
        hre.ethers.id("metadata:claim"),
        hre.ethers.ZeroAddress,
        0,
        0,
      );

    await manager.connect(recipient).claimPayout(1);

    const summary = await manager.getPayoutSummary(1);
    expect(summary.status).to.equal(1n);
  });

  it("lets the creator cancel a payout before claim", async function () {
    const { manager, admin, recipient } = await loadFixture(deployFixture);
    const encryptedAmount = await encryptUint64(admin, 820_000n);

    await manager
      .connect(admin)
      .createConfidentialPayout(
        recipient.address,
        encryptedAmount,
        hre.ethers.id("metadata:cancel"),
        hre.ethers.ZeroAddress,
        0,
        0,
      );

    await manager.connect(admin).cancelPayout(1);

    const summary = await manager.getPayoutSummary(1);
    expect(summary.status).to.equal(2n);
  });

  it("creates a confidential batch payroll run", async function () {
    const { manager, admin, recipient, recipientTwo } =
      await loadFixture(deployFixture);

    await initializeSigner(admin);
    const encryptedAmounts = await cofhejs.encrypt([
      Encryptable.uint64(4_000_000n),
      Encryptable.uint64(4_500_000n),
    ] as const);

    if (!encryptedAmounts.success) {
      throw new Error(encryptedAmounts.error.message);
    }

    await manager.connect(admin).createBatchPayouts(
      [recipient.address, recipientTwo.address],
      encryptedAmounts.data,
      [hre.ethers.id("payroll:a"), hre.ethers.id("payroll:b")],
      hre.ethers.ZeroAddress,
      0,
      1,
      hre.ethers.id("batch:payroll"),
    );

    const batch = await manager.getBatchSummary(1);
    expect(batch.id).to.equal(1n);
    expect(batch.itemCount).to.equal(2n);
    expect(batch.kind).to.equal(1n);

    const payoutIds = await manager.getBatchPayoutIds(1);
    expect(payoutIds.map((value: bigint) => Number(value))).to.deep.equal([
      1, 2,
    ]);

    const firstHandle = await manager.getPayoutAmountHandle(1);
    const secondHandle = await manager.getPayoutAmountHandle(2);
    await hre.cofhe.mocks.expectPlaintext(firstHandle, 4_000_000n);
    await hre.cofhe.mocks.expectPlaintext(secondHandle, 4_500_000n);
  });

  it("grants selective disclosure access to an auditor", async function () {
    const { manager, admin, recipient, auditor, outsider } =
      await loadFixture(deployFixture);
    const encryptedAmount = await encryptUint64(admin, 9_900_000n);

    await manager
      .connect(admin)
      .createConfidentialPayout(
        recipient.address,
        encryptedAmount,
        hre.ethers.id("metadata:disclosure"),
        hre.ethers.ZeroAddress,
        0,
        2,
      );

    const amountHandle = await manager.getPayoutAmountHandle(1);

    await initializeSigner(outsider);
    const denied = await cofhejs.unseal(amountHandle, FheTypes.Uint64);
    expect(denied.success).to.equal(false);

    await manager.connect(admin).grantPayoutAccess(1, auditor.address);

    await initializeSigner(auditor);
    const disclosed = await cofhejs.unseal(amountHandle, FheTypes.Uint64);
    await hre.cofhe.expectResultValue(disclosed, 9_900_000n);
  });
});
