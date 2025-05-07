import { useState } from "react";

const ConnectWallet = ({ account }) => {
  const [error, setError] = useState("");

  const connect = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        window.location.reload();
      } else {
        setError("Please install MetaMask or another Web3 wallet.");
      }
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
  };

  return (
    <div className="mt-4 text-center">
      {account ? (
        <p className="text-green-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <button
          onClick={connect}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      )}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default ConnectWallet;
