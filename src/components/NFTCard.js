// src/components/NFTCard.js
import React, { useState } from 'react';
import './NFTCard.css';

const NFTCard = ({ nft }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!nft || !nft.metadata) {
    return <div className="nft-card error">Invalid NFT data</div>;
  }

  const { name, image, attributes = [] } = nft.metadata;

  return (
    <div className="nft-card">
      <div className="nft-image-container">
        {!imageLoaded && <div className="image-placeholder">Loading...</div>}
        <img
          src={image}
          alt={name}
          className={`nft-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={handleImageLoad}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-image.png';
            setImageLoaded(true);
          }}
        />
      </div>
      
      <div className="nft-info">
        <h3 className="nft-name">{name}</h3>
        
        <button 
          className="details-toggle" 
          onClick={toggleDetails}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
        
        {showDetails && (
          <div className="nft-details">
            <h4>Attributes:</h4>
            <ul className="attributes-list">
              {attributes.length > 0 ? (
                attributes.map((attr, index) => (
                  <li key={index} className="attribute-item">
                    <span className="attribute-type">{attr.trait_type}:</span>
                    <span className="attribute-value">{attr.value}</span>
                  </li>
                ))
              ) : (
                <li>No attributes found</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTCard;