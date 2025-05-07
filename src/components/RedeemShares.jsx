import { useState } from "react";
import { ethers } from "ethers";

const RedeemShares = ({ contract, account }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = ethers.utils.parseEther(amount);
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert("Shares redeemed successfully!");
      setAmount("");
    } catch (err) {
      setError("Error redeeming shares: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Redeem Shares</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of PLSTR"
        className="w-full p-2 border rounded-lg mb-4"
      />
      <button
        onClick={handleRedeem}
        disabled={loading || !amount}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Processing..." : "Redeem Shares"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default RedeemShares;
