/**
 * @file src/components/CustomWalletButton.tsx
 * Last updated: 2025-01-24 05:05:14
 * Author: jake1318
 */

import { useWallets } from "@mysten/dapp-kit";
import { useState } from "react";
import "./customwalletbutton.css";

export function CustomWalletButton() {
  const wallets = useWallets();
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<
    string | null
  >(null);

  const handleWalletConnect = async () => {
    if (!wallets || wallets.length === 0) {
      alert("No wallets found. Please install a Sui wallet extension.");
      return;
    }

    const selectedWallet = wallets[0];
    try {
      if (selectedWallet.features["standard:connect"]) {
        const connectFeature = selectedWallet.features["standard:connect"];
        await connectFeature.connect();
        const address = selectedWallet.accounts[0]?.address;
        if (address) {
          setConnectedWalletAddress(address);
        }
      } else {
        alert("The selected wallet does not support connection functionality.");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect to the wallet.");
    }
  };

  const handleWalletDisconnect = () => {
    setConnectedWalletAddress(null);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <div className="wallet-container">
      {connectedWalletAddress ? (
        <div className="wallet-connected">
          <button className="wallet-address">
            {formatAddress(connectedWalletAddress)}
          </button>
          <button
            className="wallet-disconnect"
            onClick={handleWalletDisconnect}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button className="wallet-connect" onClick={handleWalletConnect}>
          Connect Wallet
        </button>
      )}
    </div>
  );
}
