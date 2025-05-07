import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getStakedPLSContract } from "../web3";

const AdminPanel = ({ web3, contract, account }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [recoverToken, setRecoverToken] = useState("");
  const [recoverAmount, setRecoverAmount] = useState("");
  const [recoverRecipient, setRecoverRecipient] = useState("");
  const [newController, setNewController] = useState("");
  const [nextMintTime, setNextMintTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMintInfo = async () => {
      try {
        const nextMint = await contract.methods.getOwnerMintInfo().call();
        setNextMintTime(Number(nextMint));
      } catch (err) {
        console.error("Failed to fetch mint info:", err);
      }
    };
    if (contract) fetchMintInfo();
  }, [contract]);

  const handleDeposit = async () => {
    setLoading(true);
    setError("");
    try {
      const stakedPLSContract = await getStakedPLSContract(web3);
      const amountWei = ethers.utils.parseEther(depositAmount);
      await stakedPLSContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.depositStakedPLS(amountWei).send({ from: account });
      alert("Deposit successful!");
      setDepositAmount("");
    } catch (err) {
      setError("Error depositing: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMint = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = ethers.utils.parseEther(mintAmount);
      await contract.methods.mintShares(amountWei).send({ from: account });
      alert("Shares minted successfully!");
      setMintAmount("");
    } catch (err) {
      setError("Error minting shares: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = ethers.utils.parseEther(recoverAmount);
      await contract.methods
        .recoverTokens(recoverToken, recoverRecipient, amountWei)
        .send({ from: account });
      alert("Tokens recovered successfully!");
      setRecoverToken("");
      setRecoverAmount("");
      setRecoverRecipient("");
    } catch (err) {
      setError("Error recovering tokens: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferOwnership = async () => {
    setLoading(true);
    setError("");
    try {
      await contract.methods.transferOwnership(newController).send({ from: account });
      alert("Ownership transferred successfully!");
      setNewController("");
    } catch (err) {
      setError("Error transferring ownership: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Panel</h2>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Deposit StakedPLS</h3>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount of stakedPLS"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <button
            onClick={handleDeposit}
            disabled={loading || !depositAmount}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Deposit"}
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Mint Shares</h3>
          <p>Next Mint Available: {new Date(nextMintTime * 1000).toLocaleString()}</p>
          <input
            type="number"
            value={mintAmount}
            onChange={(e) => setMintAmount(e.target.value)}
            placeholder="Amount of PLSTR"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <button
            onClick={handleMint}
            disabled={loading || !mintAmount}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Mint Shares"}
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Recover Tokens</h3>
          <input
            type="text"
            value={recoverToken}
            onChange={(e) => setRecoverToken(e.target.value)}
            placeholder="Token Address"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <input
            type="text"
            value={recoverRecipient}
            onChange={(e) => setRecoverRecipient(e.target.value)}
            placeholder="Recipient Address"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <input
            type="number"
            value={recoverAmount}
            onChange={(e) => setRecoverAmount(e.target.value)}
            placeholder="Amount"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <button
            onClick={handleRecover}
            disabled={loading || !recoverToken || !recoverRecipient || !recoverAmount}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Recover Tokens"}
          </button>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Transfer Ownership</h3>
          <input
            type="text"
            value={newController}
            onChange={(e) => setNewController(e.target.value)}
            placeholder="New Controller Address"
            className="w-full p-2 border rounded-lg mb-2"
          />
          <button
            onClick={handleTransferOwnership}
            disabled={loading || !newController}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Transfer Ownership"}
          </button>
        </div>
      </div>
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default AdminPanel;
