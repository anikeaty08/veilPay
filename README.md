# VeilPay

VeilPay is a privacy-first payout, payroll, grant, reimbursement, and invoicing app for EVM teams using Fhenix CoFHE.

It is intentionally positioned as:

`Confidential payouts, payroll, and treasury operations on EVM using FHE.`

It is not presented as fully anonymous payments.

## What VeilPay does

- Create confidential single payouts with encrypted amounts
- Create confidential batch payroll or grant runs
- Let recipients open a private inbox and claim live payouts
- Let admins reveal only the payouts they are authorized to see
- Let admins selectively grant payout disclosure access to auditors/accountants
- Persist only safe metadata in MongoDB while keeping amounts encrypted onchain

## Privacy model

Protected / confidential:

- payout amounts
- payroll allocations
- grant sizes
- reimbursement values

Public / minimized:

- payout IDs
- transaction existence
- creator address
- recipient routing address for MVP inbox discovery
- timestamps
- status
- metadata hash

## Selective disclosure

VeilPay uses Fhenix CoFHE access control and permits together:

1. Payout amounts are stored as encrypted `euint64` values onchain.
2. The creator and recipient are granted access to the encrypted handle.
3. An admin can call `grantPayoutAccess` for a specific auditor/accountant.
4. The authorized viewer reveals the amount only with a valid permit.

This keeps disclosure scoped to the exact payout(s) the admin chooses to share.

## MVP tradeoffs

- Recipient routing is public in this MVP so inbox discovery stays simple and reliable.
- Amounts stay encrypted onchain.
- MongoDB stores only safe metadata such as organization name, label, category, due date, reference, and attachment URL.
- The app does not claim confidential token settlement yet. It focuses on confidential payout operations and disclosure workflows first.

## Repo structure

- `packages/contracts`: Hardhat + Solidity + TypeScript Fhenix CoFHE contracts and tests
- `apps/web`: Next.js frontend, wallet integration, CoFHE browser helpers, and Mongo-backed metadata API routes

## Contracts

Main contract:

- `packages/contracts/contracts/VeilPayManager.sol`

Supported flows:

- `createConfidentialPayout`
- `createBatchPayouts`
- `claimPayout`
- `cancelPayout`
- `grantPayoutAccess`
- creator / recipient / viewer payout indexes

### Testing

The contract test suite currently passes locally.

Covered cases:

- create payout
- claim payout
- cancel payout
- batch payroll
- selective auditor disclosure

Run:

```bash
npm run contracts:test
```

## Fhenix compatibility note

The app follows the current official CoFHE stack and docs, including:

- `@fhenixprotocol/cofhe-contracts`
- `cofhejs`
- `cofhe-hardhat-plugin`

For local Hardhat mock testing, the contracts package is pinned to the version combination used by the official Fhenix starter/mocks so the test environment remains compatible.

## Web app

Pages included:

- `/`
- `/dashboard`
- `/create`
- `/batch`
- `/inbox`
- `/disclosure`
- `/payouts/[id]`
- `/settings`

### Web behaviors

- wallet connect via `wagmi` + `viem`
- CoFHE initialization in the browser
- input encryption before contract submission
- amount reveal through permits
- Mongo-backed safe metadata lookup

## MongoDB usage

MongoDB is used only for non-sensitive metadata.

Stored fields:

- `payoutId`
- `batchId`
- `metadataHash`
- `creator`
- `recipient`
- `organizationName`
- `label`
- `category`
- `dueDate`
- `settlementToken`
- `tokenDecimals`
- `currencySymbol`
- `reference`
- `attachmentUrl`

Not stored:

- plaintext payout amount
- plaintext payroll allocation values

## Local setup

### 1. Install dependencies

```bash
npm run contracts:install
npm run web:install
```

### 2. Configure environment

Copy `.env.example` to `.env` and set:

- `NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS`
- `NEXT_PUBLIC_VEILPAY_CHAIN`
- `NEXT_PUBLIC_VEILPAY_COFHE_ENV`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `MONGODB_URI`
- `MONGODB_DB`
- optional RPC / explorer keys for deployment

### 3. Verify contracts

```bash
npm run contracts:compile
npm run contracts:test
```

### 4. Run the app

```bash
npm run web:dev
```

## Deployment

VeilPay is set up for a single Vercel deployment for both the frontend and the backend layer.

- Frontend pages are served by Next.js.
- Backend metadata endpoints are served by Next.js API routes under `apps/web/src/app/api`.
- MongoDB stays external and stores only non-sensitive metadata.

### 1. Deploy the contract

Deploy the contract with:

```bash
npm run contracts:deploy:arb-sepolia
```

or

```bash
npm run contracts:deploy:eth-sepolia
```

Then place the deployed address into `NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS`.

### 2. Deploy the web app to Vercel

Use one Vercel project for the whole app.

- Import the repo into Vercel
- Set the Vercel Root Directory to `apps/web`
- Keep it as a single Next.js deployment
- Frontend pages and backend API routes will deploy together

Vercel project settings:

- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: `npm install`
- Build Command: `npm run build`

### 3. Add Vercel environment variables

Add these variables in the Vercel project settings:

```env
NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS=0xa972B0a5D888e7DC4d5BB6c6C2939d1b452A5262
NEXT_PUBLIC_VEILPAY_SETTLEMENT_TOKEN=0x0000000000000000000000000000000000000000
NEXT_PUBLIC_VEILPAY_CHAIN=arb-sepolia
NEXT_PUBLIC_VEILPAY_COFHE_ENV=TESTNET
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=5648480c5e251f33ae8ff1ecea236495
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
MONGODB_DB=veilpay
```

For local app development, the same web envs belong in:

- `apps/web/.env.local`

The app-specific template is:

- `apps/web/.env.example`

## Hackathon demo script

1. Connect the admin wallet on the configured chain.
2. Open `/create` and create a confidential payout.
3. Open `/batch` and create a confidential payroll run.
4. Open `/dashboard` to show statuses without exposing every amount publicly.
5. Open `/inbox` with a recipient wallet and reveal/claim the payout.
6. Open `/disclosure`, grant access to an auditor wallet, then show the auditor reveal only the permitted payout.
7. Close on the privacy model: transparent EVM rails leak too much, while VeilPay keeps financial operations confidential and selectively revealable.

## Current verification status

Verified:

- `npm run contracts:test`
- `cmd /c npm run lint` inside `apps/web`

Environment caveat:

- `cmd /c npm run build` inside `apps/web` reaches webpack compilation and TypeScript successfully, but the final Next.js build step is blocked in this Windows environment by `spawn EPERM`. The current blocker appears environment-specific rather than a TypeScript or lint failure.
