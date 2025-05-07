import { useState, useEffect } from "react";

const ConnectWallet = ({ account, web3 }) => {
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [network, setNetwork] = useState("");
  const [rpcStatus, setRpcStatus] = useState("");

  useEffect(() => {
    const checkNetwork = async () => {
      if (web3) {
        try {
          const chainId = await web3.eth.getChainId();
          setNetwork(chainId === 1 ? "Ethereum Mainnet" : `Unknown Network (ID: ${chainId})`);
          const blockNumber = await web3.eth.getBlockNumber();
          setRpcStatus(`RPC Active (Block: ${blockNumber})`);
          console.log("Network check successful:", { chainId, blockNumber });
        } catch (err) {
          setNetwork("Network check failed");
          setRpcStatus("RPC check failed");
          console.error("Network check failed:", err);
        }
      }
    };
    checkNetwork();
  }, [web3]);

  const connect = async () => {
    setConnecting(true);
    setError("");
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask or another Web3 wallet is not installed.");
      }
      await window.ethereum.request({ method: "eth_requestAccounts" });
      console.log("Wallet connected via MetaMask");
      window.location.reload();
    } catch (err) {
      setError(err.message);
      console.error("Wallet connection error:", err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="mt-4 text-center">
      {account ? (
        <>
          <p className="text-green-400">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p className="text-gray-600">Network: {network}</p>
          <p className="text-gray-600">RPC: {rpcStatus}</p>
        </>
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
