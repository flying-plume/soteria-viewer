# Hybrid Achievement System

This system combines the best of both worlds for NFT achievements:

1. **Free On-Chain Recording**: Achievements are automatically recorded on-chain using PDAs (Program Derived Addresses) at no cost to users
2. **Optional Token Minting**: Users can choose to mint their achievements as visible tokens in their wallet by paying a small fee

## How It Works

### For Users

1. **Earn Achievements**: Complete tasks like collecting NFTs with specific traits
2. **Automatic Recording**: Achievements are automatically recorded on-chain (free)
3. **Optional Minting**: Choose to mint achievements as tokens in your wallet (user pays)

### Technical Implementation

1. **PDAs for Recording**: Uses PDAs to record achievements on-chain
   - Cost-effective (paid by the program)
   - Verifiable on-chain
   - Not visible in wallets

2. **SPL Tokens for Display**: Optional minting of SPL tokens
   - Visible in wallets like Phantom and Solflare
   - User pays the minting cost (~0.002 SOL per achievement)
   - Untradable (soulbound)

## Benefits

1. **Cost Control**: Program only pays for recording achievements, not for tokens
2. **User Choice**: Users decide if they want to pay for visible tokens
3. **Scalability**: System scales well with user growth
4. **Verifiability**: All achievements are verifiable on-chain

## Cost Comparison

| Approach | Program Cost per User | User Cost per Achievement |
|----------|----------------------|--------------------------|
| NFT-based | ~0.01383 SOL ($1.38) | Free |
| PDA-only | ~0.00005 SOL ($0.005) | Free |
| SPL Token | ~0.00349 SOL ($0.35) | Free |
| **Hybrid** | ~0.00005 SOL ($0.005) | ~0.00204 SOL ($0.20) if they choose to mint |

For 1,000 users with all 8 achievements:
- **NFT Approach**: ~110.64 SOL ($11,064) paid by program
- **Hybrid Approach**: ~0.40 SOL ($40) paid by program + user payments for tokens

## Setup Instructions

### 1. Create Authority Wallet

First, you need to create a wallet that will serve as the authority:

1. **Create a new keypair**
   ```
   cd backend
   npm install
   node create-keypair.js
   ```
   This will generate a new keypair and save it to `authority-keypair.json`.

2. **Fund the wallet**
   Send at least 1 SOL to the public key printed by the script.

### 2. Initialize Achievement Tokens

Once your authority wallet is funded, you can initialize the achievement tokens:

```
cd backend
node hybrid-server.js
```

This will:
1. Start the backend server
2. Initialize all achievement tokens
3. Print the mint addresses for each achievement

Copy the mint addresses from the console output and add them to your `.env` file.

### 3. Run the Frontend

In a new terminal:

```
npm start
```

This will start the React application. Navigate to the "Hybrid Achievements" tab to see the system in action.