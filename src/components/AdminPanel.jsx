import { useState, useEffect } from "react";

const AdminPanel = ({ web3, contract, account }) => {
  const [mintAmount, setMintAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mintCountdown, setMintCountdown] = useState("");
  const [nextMintTime, setNextMintTime] = useState("0");

  const fetchNextMintTime = async () => {
    try {
      setError("");
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      // Try getOwnerMintInfo first
      let mintTime = "0";
      if (contract.methods.getOwnerMintInfo) {
        try {
          const result = await contract.methods.getOwnerMintInfo().call();
          mintTime = result.nextMintTime || "0";
          console.log("Next mint time from getOwnerMintInfo:", mintTime);
        } catch (err) {
          console.warn("getOwnerMintInfo failed:", err.message);
        }
      } else {
        console.warn("getOwnerMintInfo method not available");
      }

      // Fallback to remainingIssuancePeriod
      const info = await contract.methods.getContractInfo().call();
      const issuancePeriod = info.remainingIssuancePeriod || "0";
      console.log("remainingIssuancePeriod:", issuancePeriod);

      // Use issuancePeriod if it's non-zero and greater than mintTime
      if (Number(issuancePeriod) > 0 && Number(issuancePeriod) > Number(mintTime)) {
        mintTime = issuancePeriod;
        console.log("Using remainingIssuancePeriod for countdown:", mintTime);
      }

      setNextMintTime(mintTime);
    } catch (err) {
      console.error("Failed to fetch mint info:", err);
      setError(`Failed to load mint info: ${err.message || "Unknown error"}`);
      setNextMintTime("0");
    }
  };

  useEffect(() => {
    if (contract && web3) fetchNextMintTime();
  }, [contract, web3]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
      const secondsRemaining = Number(nextMintTime);
      if (secondsRemaining <= 0) {
        setMintCountdown("Issuance Period Ended or Data Unavailable");
        return;
      }
      const adjustedSeconds = secondsRemaining - now;
      if (adjustedSeconds <= 0) {
        setMintCountdown("Mint Available Now");
        return;
      }
      const days = Math.floor(adjustedSeconds / 86400);
      const hours = Math.floor((adjustedSeconds % 86400) / 3600);
      const minutes = Math.floor((adjustedSeconds % 3600) / 60);
      const seconds = adjustedSeconds % 60;
      setMintCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextMintTime]);

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert("PLSTR minted successfully!");
      setMintAmount("");
      fetchNextMintTime(); // Refresh after minting
      console.log("PLSTR minted:", { amountWei });
    } catch (err) {
      setError(`Error minting PLSTR: ${err.message || "Unknown error"}`);
      console.error("Mint error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(depositAmount, "ether");
      await contract.methods.depositStakedPLS(amountWei).send({ from: account });
      alert("vPLS deposited successfully!");
      setDepositAmount("");
      console.log("vPLS deposited:", { amountWei });
    } catch (err) {
      setError(`Error depositing vPLS: ${err.message || "Unknown error"}`);
      console.error("Deposit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(recoverAmount, "ether");
      await contract.methods
        .recoverTokens(tokenAddress, recipientAddress, amountWei)
        .send({ from: account });
      alert("Tokens recovered successfully!");
      setTokenAddress("");
      setRecipientAddress("");
      setRecoverAmount("");
      console.log("Tokens recovered:", { tokenAddress, recipientAddress, amountWei });
    } catch (err) {
      setError(`Error recovering tokens: ${err.message || "Unknown error"}`);
      console.error("Recover error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setLoading(true);
    setError("");
    try {
      await contract.methods.transferOwnership(newOwner).send({ from: account });
      alert("Ownership transferred successfully!");
      setNewOwner("");
      console.log("Ownership transferred:", { newOwner });
    } catch (err) {
      setError(`Error transferring ownership: ${err.message || "Unknown error"}`);
      console.error("Transfer ownership error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Admin Panel</h2>
      <p className="text-gray-600 mb-4">Next Mint In: {mintCountdown}</p>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Mint PLSTR</h3>
        <input
          type="number"
          value={mintAmount}
          onChange={(e) => setMintAmount(e.target.value)}
          placeholder="Amount to mint"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <button
          onClick={handleMint}
          disabled={loading || !mintAmount}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Mint PLSTR"}
        </button>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Deposit vPLS</h3>
        <input
          type="number"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          placeholder="Amount to deposit"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <button
          onClick={handleDeposit}
          disabled={loading || !depositAmount}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Deposit vPLS"}
        </button>
      </div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Recover Tokens</h3>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
          placeholder="Token address"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder="Recipient address"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <input
          type="number"
          value={recoverAmount}
          onChange={(e) => setRecoverAmount(e.target.value)}
          placeholder="Amount to recover"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <button
          onClick={handleRecover}
          disabled={loading || !tokenAddress || !recipientAddress || !recoverAmount}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Recover Tokens"}
        </button>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Transfer Ownership</h3>
        <input
          type="text"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value)}
          placeholder="New owner address"
          className="w-full p-2 border rounded-lg mb-2"
        />
        <button
          onClick={handleTransferOwnership}
          disabled={loading || !newOwner}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Transfer Ownership"}
        </button>
      </div>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default AdminPanel;
