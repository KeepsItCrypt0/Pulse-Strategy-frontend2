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
  const [hasIssuedShares, setHasIssuedShares] = useState(false);

  const checkIssuance = async () => {
    try {
      const shareInfo = await contract.methods.getUserShareInfo(account).call();
      const shareBalance = Number(shareInfo.shareBalance);
      setHasIssuedShares(shareBalance > 0);
      console.log("Checked issuance:", { account, shareBalance, hasIssuedShares: shareBalance > 0 });
    } catch (err) {
      console.error("Failed to check issuance:", err);
      setError(`Failed to load share info: ${err.message || "Unknown error"}`);
    }
  };

  const fetchNextMintTime = async () => {
    try {
      const result = await contract.methods.getOwnerMintInfo().call();
      setNextMintTime(result.nextMintTime);
      console.log("Next mint time:", result.nextMintTime);
    } catch (err) {
      console.error("Failed to fetch next mint time:", err);
      setError(`Failed to load mint info: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && web3 && account) {
      checkIssuance();
      if (hasIssuedShares) fetchNextMintTime();
    }
  }, [contract, web3, account, hasIssuedShares]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
      const secondsRemaining = Number(nextMintTime) - now;
      if (secondsRemaining <= 0) {
        setMintCountdown("Mint Available Now");
        return;
      }
      const hours = Math.floor(secondsRemaining / 3600);
      const minutes = Math.floor((secondsRemaining % 3600) / 60);
      const seconds = secondsRemaining % 60;
      setMintCountdown(`${hours}h ${minutes}m ${seconds}s`);
    };
    if (hasIssuedShares) {
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    } else {
      setMintCountdown(""); // Hide countdown if no issuance
    }
  }, [nextMintTime, hasIssuedShares]);

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(mintAmount, "ether");
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert("PLSTR minted successfully!");
      setMintAmount("");
      fetchNextMintTime();
      checkIssuance(); // Re-check issuance after mint
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
      {hasIssuedShares && mintCountdown && (
        <p className="text-gray-600 mb-4">Next Mint In: {mintCountdown}</p>
      )}
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
          disabled={ albertyou || !tokenAddress || !recipientAddress || !recoverAmount}
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
