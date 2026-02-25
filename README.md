# Onchain E-Commerce Store (Base Sepolia)

A full-stack onchain e-commerce store built on **Base Sepolia**, where users purchase clothing using **USDC**.  
The project combines smart contracts with **Next.js Server Actions / API routes** to handle backend logic such as order processing, validation, and event indexing.

---

##  Overview

This project explores how real-world commerce can be powered by **stablecoin payments**, smart contracts, and modern Web3 frontend tooling.

Users connect their wallet, select clothing items, and pay in USDC on **Base Sepolia**. Smart contracts handle payments, while the **server-side of Next.js** acts as a robust backend for order management and offchain coordination.

---

##  Key Features

-  **USDC Payments (ERC-20)**  
  Stablecoin-based checkout for predictable pricing.

-  **Base Sepolia Network**  
  Fast and low-cost onchain transactions.

-  **Wallet-Based Checkout**  
  Non-custodial payments directly from the user’s wallet.

-  **Next.js Server-Side Backend**  
  Uses Next.js API routes / server actions for:
  - Order validation
  - Transaction verification
  - Event handling
  - Secure backend logic without a separate server

-  **Onchain Purchase Records**  
  Each purchase emits onchain events for transparency and traceability.

---

##  Architecture

- **Frontend**: Next.js (React)
- **Backend**: Next.js Server Actions / API Routes
- **Smart Contracts**:
  - USDC payment handling
  - Item pricing validation
  - Purchase event emission
- **Blockchain**: Base Sepolia
-  **Database**: postgreSQL(Supabase)
- **Token**: USDC

---

##  Purchase Flow

1. User connects wallet
2. User selects a clothing item
3. Frontend calls Next.js server endpoint
4. Server validates item and pricing
5. User approves USDC spending
6. Smart contract transfers USDC
7. Purchase event emitted onchain
8. Backend indexes and confirms order

---

##  Smart Contract Logic

- Accepts only USDC
- Verifies payment amount
- Prevents invalid purchases
- Emits events for backend indexing

---

##  Development & Testing

This project runs entirely on **Base Sepolia** for testing.

Local setup:
- Install dependencies
- Configure Base Sepolia RPC
- Fund wallet with test USDC
- Run Next.js app and deploy contracts

---

##  Why This Matters

This architecture shows how Web3 apps can:
- Combine **onchain trust** with **offchain UX**
- Avoid heavy backend infrastructure
- Deliver real-world commerce with crypto-native payments

It’s a practical example of full-stack Web3 development using modern tools.

---

##  Future Improvements

- NFT receipts for purchases
- Inventory and fulfillment tracking
- Mainnet deployment
- Merchant analytics dashboard
- Cross-chain stablecoin payments

---

##  License

MIT License
