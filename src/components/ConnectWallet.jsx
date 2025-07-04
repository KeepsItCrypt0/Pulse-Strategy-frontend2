import { useState } from "react";

const ConnectWallet = ({ account, web3, contractAddress, chainId, contractSymbol }) => {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    if (!web3) {
      console.error("Web3 not initialized");
      return;
    }
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

  const explorerUrl = "https://ipfs.scan.pulsechain.com";

  return (
    <div className="mt-4 text-center">
      <h2 className="text-lg font-semibold text-gray-800">Wallet Connection</h2>
      {account ? (
        <>
          <p className="text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="text-gray-600">
            {contractSymbol} Contract:{" "}
            <a
              href={`${explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4B0082] hover:text-[#8B0000] truncate inline-block max-w-[200px]"
              title={contractAddress}
            >
              {contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "Not Set"}
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
