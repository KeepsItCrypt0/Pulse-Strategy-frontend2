import { useState, useEffect } from "react";

const ConnectWallet = ({ account, web3 }) => {
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

  return (
    <div className="mt-4 text-center">
      <h2 className="text-lg font-semibold text-gray-800">Wallet Connection</h2>
      {account ? (
        <>
          <p className="text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="text-gray-600">
            PLSTR Contract:{" "}
            <a
              href="https://etherscan.io/address/0x6c1dA678A1B615f673208e74AB3510c22117090e"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-red-300 truncate inline-block max-w-[200px]"
              title="0x6c1dA678A1B615f673208e74AB3510c22117090e"
            >
              {account.slice(0, 6)}...{account.slice(-4)}
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
