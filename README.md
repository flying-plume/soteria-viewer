# Solana NFT Gallery with Achievements

A React application that allows users to view their Solana NFTs from specific collections and track achievements based on NFT traits.

## Features

- Connect wallet using Phantom, Solflare, or other Solana wallets
- Manually enter a wallet address to view NFTs
- Display NFTs from specific collections
- Filter NFTs by traits
- Paginated display (10 NFTs per page)
- Achievement system for collecting specific traits and combinations

## Achievement System

The application tracks the following achievements:

- **Class-based Achievements:**
  - Telekinetic Achievement
  - Alchemist Achievement
  - Healer Achievement
  - Shepherd Achievement
  - Paradoxist Achievement (uncommon)
  - Agnostic Achievement

- **Combination Achievements:**
  - "Squad" Achievement (all 4 common classes)
  - "Elite Squad" Achievement (all 5 classes)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/solana-nft-gallery.git
   cd solana-nft-gallery
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file in the root directory with your Solana RPC URL:
   ```
   REACT_APP_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```
   
   For better performance, consider using a dedicated RPC provider like QuickNode, Alchemy, or Helius.

4. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Configuration

- The default collection address is set to `df5DkvAaLBLo4HELBwkHE8xfnzeYJCq9Be83quPEyeL`
- You can also filter by Update Authority instead of Collection address

## Deployment

To build the application for production:

```
npm run build
```
or
```
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Technologies Used

- React
- Solana Web3.js
- Solana Wallet Adapter
- NFTeyez Sol-Rayz (for fetching NFTs)
- React Router (for navigation)

## License

This project is licensed under the MIT License - see the LICENSE file for details.