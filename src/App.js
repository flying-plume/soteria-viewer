// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import NFTGallery from './components/NFTGallery';
import Achievements from './components/Achievements';
import SPLAchievements from './components/SPLAchievements';
import HybridAchievements from './components/HybridAchievements';
import './App.css';
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  // You can also provide a custom RPC endpoint
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = process.env.REACT_APP_SOLANA_RPC_URL || clusterApiUrl(network);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  const [walletAddress, setWalletAddress] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  const handleManualAddressSubmit = (e) => {
    e.preventDefault();
    setWalletAddress(manualAddress);
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <div className="app">
              <header className="app-header">
                <h1>Solana NFT Gallery</h1>
                <nav>
                  <Link to="/">NFT Gallery</Link>
                  <Link to="/achievements">Achievements</Link>
                  <Link to="/spl-achievements">SPL Achievements</Link>
                  <Link to="/hybrid-achievements">Hybrid Achievements</Link>
                </nav>
              </header>

              <div className="wallet-section">
                <div className="connect-wallet">
                  <h2>Connect Your Wallet</h2>
                  <div className="wallet-adapter-button-wrapper">
                    <WalletConnectButton setWalletAddress={setWalletAddress} />
                  </div>
                </div>
                
                <div className="manual-address">
                  <h2>Or Enter Wallet Address</h2>
                  <form onSubmit={handleManualAddressSubmit}>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="Enter Solana wallet address"
                    />
                    <button type="submit">Submit</button>
                  </form>
                </div>
              </div>

              <Routes>
                <Route 
                  path="/" 
                  element={<NFTGallery walletAddress={walletAddress} />} 
                />
                <Route 
                  path="/achievements" 
                  element={<Achievements walletAddress={walletAddress} />} 
                />
                <Route 
                  path="/spl-achievements" 
                  element={<SPLAchievements walletAddress={walletAddress} />} 
                />
                <Route 
                  path="/hybrid-achievements" 
                  element={<HybridAchievements walletAddress={walletAddress} />} 
                />
              </Routes>
            </div>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Custom button component that updates parent state when wallet is connected
function WalletConnectButton({ setWalletAddress }) {
  const { publicKey, wallet } = useWallet();
  
  React.useEffect(() => {
    if (publicKey) {
      setWalletAddress(publicKey.toString());
    }
  }, [publicKey, setWalletAddress]);

  return <WalletMultiButton />;
}

export default App;