import { useState } from "react";

const ConnectWallet = ({ account }) => {
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask or another Web3 wallet is not installed.");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mt-4 text-center">
      {account ? (
        <p className="text-green-400">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
      ) : (
        <>
          <button
            onClick={connect}
            disabled={connecting}
            className={connecting ? "btn-disabled" : "btn-primary"}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </button>
          {error && (
            <div className="mt-2">
              <p className="text-red-400">{error}</p>
              <button
                onClick={connect}
                className="mt-2 text-purple-300 hover:text-pink-400"
              >
                Retry
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConnectWallet;
