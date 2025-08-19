// backend/hybrid-server.js
const express = require('express');
const cors = require('cors');
const { PublicKey } = require('@solana/web3.js');
const { 
  initializeAchievementTokens, 
  checkAndRecordAchievements,
  mintAchievementToken,
  getUserAchievements,
  achievementDefinitions
} = require('./hybrid-achievement-service');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting to prevent abuse
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiting to achievement endpoints
app.use('/api/achievements', limiter);

// Initialize achievement tokens when server starts
let tokensInitialized = false;
async function initializeTokens() {
  try {
    await initializeAchievementTokens();
    tokensInitialized = true;
    console.log('Achievement tokens initialized successfully');
  } catch (error) {
    console.error('Error initializing achievement tokens:', error);
  }
}

// Validate Solana address
function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
}

// Endpoint to check and record achievements (free for users)
app.post('/api/achievements/check', async (req, res) => {
  try {
    // Make sure tokens are initialized
    if (!tokensInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Achievement system is still initializing. Please try again in a moment.'
      });
    }
    
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Solana wallet address' 
      });
    }
    
    // Process might take some time, so we'll respond immediately
    res.status(202).json({ 
      success: true, 
      message: 'Achievement check initiated. This process may take a few minutes.',
      walletAddress
    });
    
    // Process achievements asynchronously
    checkAndRecordAchievements(walletAddress)
      .then(result => {
        console.log(`Achievement check completed for ${walletAddress}:`, result);
      })
      .catch(error => {
        console.error(`Achievement check failed for ${walletAddress}:`, error);
      });
    
  } catch (error) {
    console.error('Error in achievement check endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error processing achievement check' 
    });
  }
});

// Endpoint to mint achievement token (user pays)
app.post('/api/achievements/mint', async (req, res) => {
  try {
    // Make sure tokens are initialized
    if (!tokensInitialized) {
      return res.status(503).json({
        success: false,
        error: 'Achievement system is still initializing. Please try again in a moment.'
      });
    }
    
    const { walletAddress, achievementId } = req.body;
    
    if (!walletAddress || !achievementId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address and achievement ID are required' 
      });
    }
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Solana wallet address' 
      });
    }
    
    // Check if achievement ID is valid
    const achievement = achievementDefinitions.find(a => a.id === achievementId);
    if (!achievement) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid achievement ID' 
      });
    }
    
    // Mint the achievement token
    const result = await mintAchievementToken(walletAddress, achievementId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Achievement token "${achievement.name}" minted successfully!`,
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to mint achievement token'
      });
    }
    
  } catch (error) {
    console.error('Error in mint achievement endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error minting achievement token' 
    });
  }
});

// Endpoint to get user's achievements
app.get('/api/achievements/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address is required' 
      });
    }
    
    if (!isValidSolanaAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Solana wallet address' 
      });
    }
    
    // Get user's achievements
    const result = await getUserAchievements(walletAddress);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to get user achievements'
      });
    }
    
  } catch (error) {
    console.error('Error in get user achievements endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error getting user achievements' 
    });
  }
});

// Endpoint to get achievement definitions
app.get('/api/achievements/definitions', (req, res) => {
  // Return achievement definitions
  res.json({ 
    success: true, 
    definitions: achievementDefinitions 
  });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize tokens when server starts
  await initializeTokens();
});