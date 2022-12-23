import React, {useMemo} from 'react';
import './App.css';
import {PhantomWalletAdapter} from "@solana/wallet-adapter-wallets";
import {ConnectionProvider, WalletProvider} from "@solana/wallet-adapter-react";
import {WalletModalProvider, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {NftGrid} from "./components/NftGrid";
import {WalletAdapterNetwork} from "@solana/wallet-adapter-base";
import {clusterApiUrl} from "@solana/web3.js";

// Solana React UI css
require('@solana/wallet-adapter-react-ui/styles.css');
const network = ("mainnet-beta") as WalletAdapterNetwork;
function App() {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  // Add more wallets here if needed
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <div className="App">
            <header>
              <h1>Technical Test</h1>
              <WalletMultiButton></WalletMultiButton>
            </header>

            <main>
              <NftGrid></NftGrid>
            </main>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
