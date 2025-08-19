// src/components/Achievements.js
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import './Achievements.css';

const Achievements = ({ walletAddress }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [useUpdateAuthority, setUseUpdateAuthority] = useState(false);
  const [updateAuthority, setUpdateAuthority] = useState('');
  
  const collectionAddress = 'df5DkvAaLBLo4HELBwkHE8xfnzeYJCq9Be83quPEyeL';

  // Define achievements
  const achievementDefinitions = [
    {
      id: 'telekinetic',
      name: 'Telekinetic',
      description: 'Collect an NFT with the Telekinetic class',
      image: '/achievements/telekinetic.png',
      checkFn: (nfts) => hasClass(nfts, 'Telekinetic')
    },
    {
      id: 'alchemist',
      name: 'Alchemist',
      description: 'Collect an NFT with the Alchemist class',
      image: '/achievements/alchemist.png',
      checkFn: (nfts) => hasClass(nfts, 'Alchemist')
    },
    {
      id: 'healer',
      name: 'Healer',
      description: 'Collect an NFT with the Healer class',
      image: '/achievements/healer.png',
      checkFn: (nfts) => hasClass(nfts, 'Healer')
    },
    {
      id: 'shepherd',
      name: 'Shepherd',
      description: 'Collect an NFT with the Shepherd class',
      image: '/achievements/shepherd.png',
      checkFn: (nfts) => hasClass(nfts, 'Shepherd')
    },
    {
      id: 'paradoxist',
      name: 'Paradoxist',
      description: 'Collect an NFT with the uncommon Paradoxist class',
      image: '/achievements/paradoxist.png',
      checkFn: (nfts) => hasClass(nfts, 'Paradoxist')
    },
    {
      id: 'agnostic',
      name: 'Agnostic',
      description: 'Collect an NFT with the Agnostic class',
      image: '/achievements/agnostic.png',
      checkFn: (nfts) => hasClass(nfts, 'Agnostic')
    },
    {
      id: 'squad',
      name: 'Squad',
      description: 'Collect all four common classes (Telekinetic, Alchemist, Healer, Shepherd)',
      image: '/achievements/squad.png',
      checkFn: (nfts) => 
        hasClass(nfts, 'Telekinetic') && 
        hasClass(nfts, 'Alchemist') && 
        hasClass(nfts, 'Healer') && 
        hasClass(nfts, 'Shepherd')
    },
    {
      id: 'elite_squad',
      name: 'Elite Squad',
      description: 'Collect all five classes (Telekinetic, Alchemist, Healer, Shepherd, Paradoxist)',
      image: '/achievements/elite_squad.png',
      checkFn: (nfts) => 
        hasClass(nfts, 'Telekinetic') && 
        hasClass(nfts, 'Alchemist') && 
        hasClass(nfts, 'Healer') && 
        hasClass(nfts, 'Shepherd') &&
        hasClass(nfts, 'Paradoxist')
    }
  ];

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

  // Fetch NFTs when wallet address changes
  useEffect(() => {
    if (!walletAddress) {
      setNfts([]);
      return;
    }

    const fetchNFTs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const connection = new Connection(
          process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
          'confirmed'
        );
        
        const nftAccounts = await getParsedNftAccountsByOwner({
          publicAddress: walletAddress,
          connection
        });
        
        // Filter NFTs by collection or update authority
        let filteredAccounts = nftAccounts;
        
        if (useUpdateAuthority && updateAuthority) {
          filteredAccounts = nftAccounts.filter(nft => 
            nft.updateAuthority === updateAuthority
          );
        } else {
          filteredAccounts = nftAccounts.filter(nft => 
            nft.data.creators?.some(creator => 
              creator.address === collectionAddress
            )
          );
        }
        
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
        
        setNfts(nftsWithMetadata);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError('Failed to fetch NFTs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [walletAddress, useUpdateAuthority, updateAuthority]);

  // Calculate achievements when NFTs change
  useEffect(() => {
    if (nfts.length === 0) {
      setAchievements([]);
      return;
    }

    const unlockedAchievements = achievementDefinitions
      .filter(achievement => achievement.checkFn(nfts))
      .map(achievement => ({
        ...achievement,
        unlocked: true
      }));

    const lockedAchievements = achievementDefinitions
      .filter(achievement => !achievement.checkFn(nfts))
      .map(achievement => ({
        ...achievement,
        unlocked: false
      }));

    setAchievements([...unlockedAchievements, ...lockedAchievements]);
  }, [nfts]);

  // Toggle between collection address and update authority
  const toggleFilterMethod = () => {
    setUseUpdateAuthority(!useUpdateAuthority);
  };

  return (
    <div className="achievements-container">
      <h2>NFT Achievements</h2>
      
      <div className="filter-method">
        <label>
          <input
            type="checkbox"
            checked={useUpdateAuthority}
            onChange={toggleFilterMethod}
          />
          Filter by Update Authority instead of Collection
        </label>
        
        {useUpdateAuthority && (
          <input
            type="text"
            value={updateAuthority}
            onChange={(e) => setUpdateAuthority(e.target.value)}
            placeholder="Enter Update Authority address"
            className="update-authority-input"
          />
        )}
      </div>

      {loading ? (
        <div className="loading">Loading achievements...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !walletAddress ? (
        <div className="no-wallet">
          Please connect your wallet or enter a wallet address to view achievements.
        </div>
      ) : nfts.length === 0 ? (
        <div className="no-nfts">
          No NFTs found for this wallet in the specified collection.
        </div>
      ) : (
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-image-container">
                <img 
                  src={achievement.image} 
                  alt={achievement.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-achievement.png';
                  }}
                />
                {!achievement.unlocked && (
                  <div className="locked-overlay">
                    <span>🔒</span>
                  </div>
                )}
              </div>
              
              <div className="achievement-info">
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>
                
                {achievement.unlocked ? (
                  <div className="achievement-status unlocked">
                    Unlocked! 🎉
                  </div>
                ) : (
                  <div className="achievement-status locked">
                    Locked
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;