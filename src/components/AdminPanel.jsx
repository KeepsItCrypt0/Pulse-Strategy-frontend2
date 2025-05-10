import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const AdminPanel = ({ web3, contract, account }) => {
  const [mintAmount, setMintAmount] = useState("");
  const [displayMintAmount, setDisplayMintAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [displayDepositAmount, setDisplayDepositAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [displayRecoverAmount, setDisplayRecoverAmount] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mintCountdown, setMintCountdown] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState("0");

  const fetchMintInfo = async () => {
    try {
      setError("");
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      // Try getOwnerMintInfo for next mint timestamp
      let nextMintTime = "0";
      if (contract.methods.getOwnerMintInfo) {
        try {
          const result = await contract.methods.getOwnerMintInfo().call();
          nextMintTime = result.nextMintTime || "0";
          console.log("Next mint time from getOwnerMintInfo:", nextMintTime);
        } catch (err) {
          console.warn("getOwnerMintInfo failed:", err.message);
        }
      } else {
        console.warn("getOwnerMintInfo method not available");
      }

      // Fetch remainingIssuancePeriod (duration in seconds)
      const info = await contract.methods.getContractInfo().call();
      const issuancePeriod = info.remainingIssuancePeriod || "0";
      console.log("remainingIssuancePeriod:", issuancePeriod);

      // Use remainingIssuancePeriod as the duration if non-zero
      if (Number(issuancePeriod) > 0) {
        setRemainingSeconds(issuancePeriod);
        console.log("Using remainingIssuancePeriod for countdown:", issuancePeriod);
      } else if (Number(nextMintTime) > 0) {
        // Fallback to nextMintTime if issuancePeriod is 0
        setRemainingSeconds(nextMintTime);
        console.log("Using nextMintTime for countdown:", nextMintTime);
      } else {
        throw new Error("No valid countdown data available");
      }
    } catch (err) {
      console.error("Failed to fetch mint info:", err);
      setError(`Failed to load mint info: ${err.message || "Unknown error"}`);
      setRemainingSeconds("0");
    }
  };

  useEffect(() => {
    if (contract && web3) {
      fetchMintInfo();
      // Retry on MetaMask errors
      const retryInterval = setInterval(() => {
        if (error.includes("message channel closed")) {
          console.log("Retrying fetchMintInfo due to MetaMask error...");
          fetchMintInfo();
        }
      }, 5000);
      return () => clearInterval(retryInterval);
    }
  }, [contract, web3]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(remainingSeconds);
      console.log("Updating countdown with remainingSeconds:", seconds);
      if (seconds <= 0) {
        setMintCountdown("Issuance Period Ended or Data Unavailable");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      const countdownText = `${days}d ${hours}h ${minutes}m ${secs}s`;
      setMintCountdown(countdownText);
      console.log("Countdown set to:", countdownText);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const handleNumericInputChange = (e, setRaw, setDisplay) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setRaw(rawValue);
      if (rawValue === "" || isNaN(rawValue)) {
        setDisplay("");
      } else {
        setDisplay(
          new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 18,
            minimumFractionDigits: 0,
          }).format(rawValue)
        );
      }
    }
  };

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert("PLSTR minted successfully!");
      setMintAmount("");
      setDisplayMintAmount("");
      fetchMintInfo(); // Refresh after minting
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
      setDisplayDepositAmount("");
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
      setDisplayRecoverAmount("");
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
          type="text"
          value={displayMintAmount}
          onChange={(e) => handleNumericInputChange(e, setMintAmount, setDisplayMintAmount)}
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
          type="text"
          value={displayDepositAmount}
          onChange={(e) => handleNumericInputChange(e, setDepositAmount, setDisplayDepositAmount)}
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
          type="text"
          value={displayRecoverAmount}
          onChange={(e) => handleNumericInputChange(e, setRecoverAmount, setDisplayRecoverAmount)}
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
