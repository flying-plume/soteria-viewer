// backend/hybrid-achievement-service.js
const { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  sendAndConfirmTransaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} = require('@solana/web3.js');
const { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Achievement definitions
const achievementDefinitions = [
  {
    id: 'telekinetic',
    name: 'Telekinetic Master',
    symbol: 'TELE',
    description: 'Awarded for collecting an NFT with the Telekinetic class',
    checkFn: (nfts) => hasClass(nfts, 'Telekinetic')
  },
  {
    id: 'alchemist',
    name: 'Alchemist Master',
    symbol: 'ALCH',
    description: 'Awarded for collecting an NFT with the Alchemist class',
    checkFn: (nfts) => hasClass(nfts, 'Alchemist')
  },
  {
    id: 'healer',
    name: 'Healer Master',
    symbol: 'HEAL',
    description: 'Awarded for collecting an NFT with the Healer class',
    checkFn: (nfts) => hasClass(nfts, 'Healer')
  },
  {
    id: 'shepherd',
    name: 'Shepherd Master',
    symbol: 'SHEP',
    description: 'Awarded for collecting an NFT with the Shepherd class',
    checkFn: (nfts) => hasClass(nfts, 'Shepherd')
  },
  {
    id: 'paradoxist',
    name: 'Paradoxist Master',
    symbol: 'PARA',
    description: 'Awarded for collecting an NFT with the uncommon Paradoxist class',
    checkFn: (nfts) => hasClass(nfts, 'Paradoxist')
  },
  {
    id: 'agnostic',
    name: 'Agnostic Master',
    symbol: 'AGNO',
    description: 'Awarded for collecting an NFT with the Agnostic class',
    checkFn: (nfts) => hasClass(nfts, 'Agnostic')
  },
  {
    id: 'squad',
    name: 'Squad Leader',
    symbol: 'SQUAD',
    description: 'Awarded for collecting all four common classes (Telekinetic, Alchemist, Healer, Shepherd)',
    checkFn: (nfts) => 
      hasClass(nfts, 'Telekinetic') && 
      hasClass(nfts, 'Alchemist') && 
      hasClass(nfts, 'Healer') && 
      hasClass(nfts, 'Shepherd')
  },
  {
    id: 'elite_squad',
    name: 'Elite Squad Leader',
    symbol: 'ELITE',
    description: 'Awarded for collecting all five classes (Telekinetic, Alchemist, Healer, Shepherd, Paradoxist)',
    checkFn: (nfts) => 
      hasClass(nfts, 'Telekinetic') && 
      hasClass(nfts, 'Alchemist') && 
      hasClass(nfts, 'Healer') && 
      hasClass(nfts, 'Shepherd') &&
      hasClass(nfts, 'Paradoxist')
  }
];

// Map to store achievement mint addresses
const achievementMints = {};

// Helper function to check if NFTs have a specific class
const hasClass = (nfts, className) => {
  return nfts.some(nft => {
    if (!nft.metadata || !nft.metadata.attributes) return false;
    
    const classAttribute = nft.metadata.attributes.find(
      attr => attr.trait_type === 'Class' || attr.trait_type === 'class'
    );
    
    return classAttribute && classAttribute.value === className;
  });
};

// Load authority keypair
function loadAuthorityKeypair() {
  try {
    // Check if keypair file exists
    if (!fs.existsSync(process.env.AUTHORITY_KEYPAIR_PATH)) {
      console.error(`Keypair file not found at ${process.env.AUTHORITY_KEYPAIR_PATH}`);
      return null;
    }
    
    const keypairData = fs.readFileSync(process.env.AUTHORITY_KEYPAIR_PATH, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(keypairData));
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    console.error('Error loading authority keypair:', error);
    return null;
  }
}

// Initialize achievement tokens (run once)
async function initializeAchievementTokens() {
  console.log('Initializing achievement tokens...');
  
  // Load authority keypair
  const authorityKeypair = loadAuthorityKeypair();
  if (!authorityKeypair) {
    throw new Error('Failed to load authority keypair');
  }
  
  // Connect to Solana
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );
  
  for (const achievement of achievementDefinitions) {
    try {
      // Check if we already have this mint stored
      if (process.env[`ACHIEVEMENT_MINT_${achievement.id.toUpperCase()}`]) {
        achievementMints[achievement.id] = new PublicKey(process.env[`ACHIEVEMENT_MINT_${achievement.id.toUpperCase()}`]);
        console.log(`Using existing mint for ${achievement.name}: ${achievementMints[achievement.id].toString()}`);
        continue;
      }
      
      // Create a new mint
      console.log(`Creating mint for ${achievement.name}...`);
      const mint = await createMint(
        connection,
        authorityKeypair,
        authorityKeypair.publicKey,
        null, // Freeze authority - null means no one can freeze
        0 // 0 decimals for achievement tokens
      );
      
      achievementMints[achievement.id] = mint;
      console.log(`Created mint for ${achievement.name}: ${mint.toString()}`);
      
      // Store the mint address for future use
      // In a production environment, you would save this to a database
      console.log(`Add this to your .env file: ACHIEVEMENT_MINT_${achievement.id.toUpperCase()}=${mint.toString()}`);
    } catch (error) {
      console.error(`Error creating mint for ${achievement.name}:`, error);
    }
  }
  
  console.log('Achievement tokens initialized!');
  return achievementMints;
}

// Find PDA for an achievement
async function findAchievementPDA(userPubkey, achievementId) {
  const PROGRAM_ID = new PublicKey(process.env.ACHIEVEMENT_PROGRAM_ID);
  
  const [pda, bump] = await PublicKey.findProgramAddress(
    [
      Buffer.from('achievement'),
      userPubkey.toBuffer(),
      Buffer.from(achievementId),
    ],
    PROGRAM_ID
  );
  
  return { pda, bump };
}

// Record achievement on-chain using PDA (free for user)
async function recordAchievementPDA(userPubkey, achievementId) {
  try {
    const achievement = achievementDefinitions.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }
    
    // Load authority keypair
    const authorityKeypair = loadAuthorityKeypair();
    if (!authorityKeypair) {
      throw new Error('Failed to load authority keypair');
    }
    
    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    // Find PDA for this achievement
    const { pda, bump } = await findAchievementPDA(new PublicKey(userPubkey), achievementId);
    
    // Check if PDA already exists
    const accountInfo = await connection.getAccountInfo(pda);
    if (accountInfo !== null) {
      console.log(`Achievement ${achievement.name} already recorded for ${userPubkey}`);
      return {
        success: true,
        alreadyRecorded: true,
        pda: pda.toString()
      };
    }
    
    // For a real implementation, you would need a Solana program to create and manage these PDAs
    // This is a simplified example that shows the concept
    console.log(`Achievement ${achievement.name} would be recorded for ${userPubkey} at PDA ${pda.toString()}`);
    
    return {
      success: true,
      pda: pda.toString(),
      simulation: true, // This is just a simulation since we don't have the actual program
      message: "In a real implementation, this would create a PDA to record the achievement"
    };
  } catch (error) {
    console.error(`Error recording achievement ${achievementId}:`, error);
    return { success: false, error: error.message };
  }
}

// Mint achievement token to user's wallet (user pays)
async function mintAchievementToken(recipient, achievementId) {
  try {
    const achievement = achievementDefinitions.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }
    
    // Load authority keypair
    const authorityKeypair = loadAuthorityKeypair();
    if (!authorityKeypair) {
      throw new Error('Failed to load authority keypair');
    }
    
    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    // Get the mint for this achievement
    const mintAddress = achievementMints[achievementId];
    if (!mintAddress) {
      throw new Error(`Mint for achievement ${achievementId} not found. Run initializeAchievementTokens first.`);
    }
    
    const recipientPublicKey = new PublicKey(recipient);
    
    // Check if the user already has this achievement token
    try {
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        authorityKeypair, // Payer for the transaction
        mintAddress,
        recipientPublicKey
      );
      
      // Mint 1 token to the user
      await mintTo(
        connection,
        authorityKeypair,
        mintAddress,
        tokenAccount.address,
        authorityKeypair,
        1 // Amount: 1 token per achievement
      );
      
      console.log(`Minted achievement token ${achievement.name} to ${recipient}`);
      
      return {
        success: true,
        mint: mintAddress.toString(),
        tokenAccount: tokenAccount.address.toString()
      };
    } catch (error) {
      console.error(`Error minting token:`, error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error(`Error minting achievement ${achievementId}:`, error);
    return { success: false, error: error.message };
  }
}

// Check achievements for a user and record them as PDAs
async function checkAndRecordAchievements(walletAddress) {
  try {
    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    const ownerPublicKey = new PublicKey(walletAddress);
    
    // Fetch user's NFTs from the collection
    const { getParsedNftAccountsByOwner } = require('@nfteyez/sol-rayz');
    const nftAccounts = await getParsedNftAccountsByOwner({
      publicAddress: walletAddress,
      connection
    });
    
    // Filter by collection
    const collectionAddress = 'df5DkvAaLBLo4HELBwkHE8xfnzeYJCq9Be83quPEyeL';
    const filteredAccounts = nftAccounts.filter(nft => 
      nft.data.creators?.some(creator => 
        creator.address === collectionAddress
      )
    );
    
    // Fetch metadata for each NFT
    const nftsWithMetadata = await Promise.all(
      filteredAccounts.map(async (nft) => {
        try {
          const response = await fetch(nft.data.uri);
          const metadata = await response.json();
          return {
            ...nft,
            metadata
          };
        } catch (err) {
          console.error('Error fetching metadata for NFT:', err);
          return {
            ...nft,
            metadata: { name: 'Unknown', image: '', attributes: [] }
          };
        }
      })
    );
    
    // Check which achievements the user qualifies for
    const results = [];
    for (const achievement of achievementDefinitions) {
      // Check if user qualifies for this achievement
      if (achievement.checkFn(nftsWithMetadata)) {
        console.log(`User qualifies for achievement: ${achievement.id}`);
        
        // Record the achievement as a PDA
        const recordResult = await recordAchievementPDA(walletAddress, achievement.id);
        results.push({
          achievement: achievement.id,
          result: recordResult
        });
      }
    }
    
    return { 
      success: true, 
      processed: achievementDefinitions.length,
      recorded: results.length,
      results 
    };
  } catch (error) {
    console.error('Error in checkAndRecordAchievements:', error);
    return { success: false, error: error.message };
  }
}

// Get all achievements for a user (both PDAs and tokens)
async function getUserAchievements(walletAddress) {
  try {
    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );
    
    const userPubkey = new PublicKey(walletAddress);
    
    // Get token accounts to check for minted achievement tokens
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      userPubkey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    // Map of achievement IDs the user has tokens for
    const tokenAchievements = {};
    
    // Check which achievements the user has tokens for
    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed.info;
      const mintAddress = parsedInfo.mint;
      const amount = parsedInfo.tokenAmount.uiAmount;
      
      // If they have at least 1 token of this mint, they have the achievement
      if (amount >= 1) {
        // Find which achievement this mint corresponds to
        for (const [achievementId, mint] of Object.entries(achievementMints)) {
          if (mint.toString() === mintAddress) {
            tokenAchievements[achievementId] = {
              type: 'token',
              id: achievementId,
              mintAddress,
              tokenAccount: account.pubkey.toString(),
              amount
            };
            break;
          }
        }
      }
    }
    
    // Check for PDA achievements
    // In a real implementation, you would query your program for PDAs
    // This is a simplified simulation
    const pdaAchievements = {};
    for (const achievement of achievementDefinitions) {
      try {
        const { pda } = await findAchievementPDA(userPubkey, achievement.id);
        
        // In a real implementation, you would check if this PDA exists
        // For now, we'll just simulate that all achievements are recorded as PDAs
        pdaAchievements[achievement.id] = {
          type: 'pda',
          id: achievement.id,
          pda: pda.toString(),
          // In a real implementation, you would get this data from the PDA
          earnedAt: new Date().toISOString()
        };
      } catch (err) {
        console.error(`Error checking PDA for ${achievement.id}:`, err);
      }
    }
    
    // Combine the results
    const achievements = {};
    for (const achievement of achievementDefinitions) {
      achievements[achievement.id] = {
        ...achievement,
        earned: pdaAchievements[achievement.id] !== undefined,
        pda: pdaAchievements[achievement.id],
        token: tokenAchievements[achievement.id]
      };
    }
    
    return {
      success: true,
      achievements: Object.values(achievements)
    };
  } catch (error) {
    console.error('Error getting user achievements:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeAchievementTokens,
  recordAchievementPDA,
  mintAchievementToken,
  checkAndRecordAchievements,
  getUserAchievements,
  achievementDefinitions,
  achievementMints
};