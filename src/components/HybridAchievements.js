// src/components/HybridAchievements.js
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import axios from 'axios';
import './Achievements.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const HybridAchievements = ({ walletAddress }) => {
  const wallet = useWallet();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch user's achievements when wallet address changes
  useEffect(() => {
    if (!walletAddress) {
      setAchievements([]);
      return;
    }
    
    fetchUserAchievements();
  }, [walletAddress]);
  
  // Function to fetch user's achievements
  const fetchUserAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/achievements/user/${walletAddress}`);
      
      if (response.data.success) {
        setAchievements(response.data.achievements);
      } else {
        setError(response.data.error || 'Failed to fetch achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Failed to fetch achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to check for new achievements
  const checkAchievements = async () => {
    if (!walletAddress) return;
    
    try {
      setChecking(true);
      
      const response = await axios.post(`${API_URL}/achievements/check`, {
        walletAddress
      });
      
      if (response.data.success) {
        // Show success message
        alert('Achievement check initiated! New achievements will be recorded shortly.');
        
        // Wait a bit and then refresh achievements
        setTimeout(() => {
          fetchUserAchievements();
        }, 5000);
      } else {
        setError(response.data.error || 'Failed to check achievements');
      }
    } catch (err) {
      console.error('Error checking achievements:', err);
      setError('Failed to check achievements. Please try again.');
    } finally {
      setChecking(false);
    }
  };
  
  // Function to mint achievement token (user pays)
  const mintAchievementToken = async (achievementId) => {
    if (!wallet.connected) {
      alert('Please connect your wallet to mint achievement tokens');
      return;
    }
    
    try {
      setMinting(true);
      
      // First, check if the user has the achievement recorded
      const achievement = achievements.find(a => a.id === achievementId);
      
      if (!achievement || !achievement.earned) {
        alert('You have not earned this achievement yet');
        setMinting(false);
        return;
      }
      
      if (achievement.token) {
        alert('You already have a token for this achievement');
        setMinting(false);
        return;
      }
      
      // Confirm the user wants to pay for minting
      if (!window.confirm('Minting this achievement token will cost approximately 0.002 SOL. Do you want to continue?')) {
        setMinting(false);
        return;
      }
      
      // Call the mint endpoint
      const response = await axios.post(`${API_URL}/achievements/mint`, {
        walletAddress: wallet.publicKey.toString(),
        achievementId
      });
      
      if (response.data.success) {
        alert(`Achievement token minted successfully! It will appear in your wallet shortly.`);
        
        // Refresh achievements
        fetchUserAchievements();
      } else {
        alert(response.data.error || 'Failed to mint achievement token');
      }
    } catch (err) {
      console.error('Error minting achievement token:', err);
      alert('Failed to mint achievement token. Please try again.');
    } finally {
      setMinting(false);
    }
  };
  
  // Achievement images (in a real app, these would be stored elsewhere)
  const getAchievementImage = (achievementId) => {
    const images = {
      telekinetic: '/achievements/telekinetic.png',
      alchemist: '/achievements/alchemist.png',
      healer: '/achievements/healer.png',
      shepherd: '/achievements/shepherd.png',
      paradoxist: '/achievements/paradoxist.png',
      agnostic: '/achievements/agnostic.png',
      squad: '/achievements/squad.png',
      elite_squad: '/achievements/elite_squad.png'
    };
    
    return images[achievementId] || '/placeholder-achievement.png';
  };

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h2>Hybrid Achievements</h2>
        
        {walletAddress && (
          <button 
            className="check-achievements-button"
            onClick={checkAchievements}
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check for New Achievements'}
          </button>
        )}
      </div>
      
      <div className="achievements-info">
        <p>
          Achievements are automatically recorded on-chain when you qualify for them.
          You can optionally mint them as tokens to display in your wallet by clicking "Mint Token".
        </p>
      </div>
      
      {loading ? (
        <div className="loading">Loading achievements...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !walletAddress ? (
        <div className="no-wallet">
          Please connect your wallet or enter a wallet address to view achievements.
        </div>
      ) : achievements.length === 0 ? (
        <div className="no-achievements">
          No achievements found. Complete tasks to earn achievements!
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.earned ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-image-container">
                <img 
                  src={getAchievementImage(achievement.id)} 
                  alt={achievement.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-achievement.png';
                  }}
                />
                {!achievement.earned && (
                  <div className="locked-overlay">
                    <span>🔒</span>
                  </div>
                )}
                
                {achievement.token && (
                  <div className="token-badge">
                    <span>🪙</span>
                  </div>
                )}
              </div>
              
              <div className="achievement-info">
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>
                
                {achievement.earned ? (
                  <div className="achievement-status unlocked">
                    Unlocked! 🏆
                    {achievement.token && (
                      <span className="token-label">Token in Wallet</span>
                    )}
                  </div>
                ) : (
                  <div className="achievement-status locked">
                    Locked
                  </div>
                )}
                
                {achievement.earned && !achievement.token && wallet.connected && (
                  <button 
                    className="mint-token-button"
                    onClick={() => mintAchievementToken(achievement.id)}
                    disabled={minting}
                  >
                    {minting ? 'Minting...' : 'Mint Token (User Pays)'}
                  </button>
                )}
                
                <div className="achievement-details">
                  <span className="achievement-symbol">{achievement.symbol}</span>
                  {achievement.token && (
                    <a 
                      href={`https://explorer.solana.com/address/${achievement.token.mintAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HybridAchievements;