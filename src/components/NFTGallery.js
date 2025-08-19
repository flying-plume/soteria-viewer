// src/components/NFTGallery.js
import React, { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz';
import NFTCard from './NFTCard';
import Pagination from './Pagination';
import TraitFilter from './TraitFilter';
import './NFTGallery.css';

const NFTGallery = ({ walletAddress }) => {
  const [nfts, setNfts] = useState([]);
  const [filteredNfts, setFilteredNfts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [traits, setTraits] = useState({});
  const [selectedTraits, setSelectedTraits] = useState({});
  const [useUpdateAuthority, setUseUpdateAuthority] = useState(false);
  const [updateAuthority, setUpdateAuthority] = useState('');
  
  const nftsPerPage = 10;
  const collectionAddress = 'df5DkvAaLBLo4HELBwkHE8xfnzeYJCq9Be83quPEyeL';

  // Fetch NFTs when wallet address changes
  useEffect(() => {
    if (!walletAddress) {
      setNfts([]);
      setFilteredNfts([]);
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
        setFilteredNfts(nftsWithMetadata);
        
        // Extract all traits from the NFTs
        const traitMap = {};
        nftsWithMetadata.forEach(nft => {
          if (nft.metadata && nft.metadata.attributes) {
            nft.metadata.attributes.forEach(attr => {
              if (!traitMap[attr.trait_type]) {
                traitMap[attr.trait_type] = new Set();
              }
              traitMap[attr.trait_type].add(attr.value);
            });
          }
        });
        
        // Convert Sets to Arrays
        const formattedTraits = {};
        Object.keys(traitMap).forEach(traitType => {
          formattedTraits[traitType] = Array.from(traitMap[traitType]);
        });
        
        setTraits(formattedTraits);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
        setError('Failed to fetch NFTs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [walletAddress, useUpdateAuthority, updateAuthority]);

  // Filter NFTs based on selected traits
  useEffect(() => {
    if (Object.keys(selectedTraits).length === 0) {
      setFilteredNfts(nfts);
      return;
    }

    const filtered = nfts.filter(nft => {
      if (!nft.metadata || !nft.metadata.attributes) return false;
      
      // Check if NFT has all selected traits
      return Object.entries(selectedTraits).every(([traitType, traitValue]) => {
        if (!traitValue) return true; // Skip if no value is selected
        
        const nftTrait = nft.metadata.attributes.find(
          attr => attr.trait_type === traitType
        );
        
        return nftTrait && nftTrait.value === traitValue;
      });
    });

    setFilteredNfts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedTraits, nfts]);

  // Get current NFTs for pagination
  const indexOfLastNft = currentPage * nftsPerPage;
  const indexOfFirstNft = indexOfLastNft - nftsPerPage;
  const currentNfts = filteredNfts.slice(indexOfFirstNft, indexOfLastNft);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle trait filter changes
  const handleTraitChange = (traitType, value) => {
    setSelectedTraits(prev => ({
      ...prev,
      [traitType]: value
    }));
  };

  // Toggle between collection address and update authority
  const toggleFilterMethod = () => {
    setUseUpdateAuthority(!useUpdateAuthority);
  };

  return (
    <div className="nft-gallery">
      <div className="filter-options">
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
        
        <TraitFilter 
          traits={traits} 
          selectedTraits={selectedTraits} 
          onTraitChange={handleTraitChange} 
        />
      </div>

      {loading ? (
        <div className="loading">Loading NFTs...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : filteredNfts.length === 0 ? (
        <div className="no-nfts">
          {walletAddress 
            ? "No NFTs found for this wallet in the specified collection." 
            : "Please connect your wallet or enter a wallet address to view NFTs."}
        </div>
      ) : (
        <>
          <div className="nft-count">
            Showing {indexOfFirstNft + 1}-{Math.min(indexOfLastNft, filteredNfts.length)} of {filteredNfts.length} NFTs
          </div>
          
          <div className="nft-grid">
            {currentNfts.map((nft, index) => (
              <NFTCard key={index} nft={nft} />
            ))}
          </div>
          
          <Pagination
            nftsPerPage={nftsPerPage}
            totalNfts={filteredNfts.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        </>
      )}
    </div>
  );
};

export default NFTGallery;