// src/components/ConnectWallet.jsx
import { useState } from "react";

const ConnectWallet = ({ account, web3, contractAddress, chainId }) => {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (!web3) return;
    setConnecting(true);
    try {
      await web3.eth.requestAccounts();
      window.location.reload();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setConnecting(false);
    }
  };

  const explorerUrl = chainId === 1 ? "https://etherscan.io" : "https://scan.pulsechain.com";

  return (
    <div className="mt-4 text-center">
      <h2 className="text-lg font-semibold text-gray-800">Wallet Connection</h2>
      {account ? (
        <>
          <p className="text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="text-gray-600">
            {chainId === 1 ? "PLSTR" : "xBOND"} Contract:{" "}
            <a
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-red-300 truncate inline-block max-w-[200px]"
              title={contractAddress}
            >
              {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
            </a>
          </p>
        </>
      ) : (
        <button
          onClick={connectWallet}
          disabled={connecting || !web3}
          className="btn-primary mt-2"
        >
          {connecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;
