import { useState } from "react";
import { ethers } from "ethers";
import { getStakedPLSContract } from "../web3";

const IssueShares = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const stakedPLSContract = await getStakedPLSContract(web3);
      const amountWei = ethers.utils.parseEther(amount);
      await stakedPLSContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("Shares issued successfully!");
      setAmount("");
    } catch (err) {
      setError("Error issuing shares: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Issue Shares</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of stakedPLS"
        className="w-full p-2 border rounded-lg mb-4"
      />
      <button
        onClick={handleIssue}
        disabled={loading || !amount}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Processing..." : "Issue Shares"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default IssueShares;
