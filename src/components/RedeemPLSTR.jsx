import { useState, useEffect } from "react";
import { ethers } from "ethers";

const RedeemPLSTR = ({ contract, account }) => {
  const [amount, setAmount] = useState("");
  const [plstrBalance, setPlstrBalance] = useState("0");
  const [estimatedVPLS, setEstimatedVPLS] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = async () => {
    try {
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      if (balance === undefined) {
        throw new Error("Invalid PLSTR balance response");
      }
      setPlstrBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error("Failed to fetch PLSTR balance:", err);
      setError(`Failed to load PLSTR balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account) fetchBalance();
  }, [contract, account]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0) {
          const amountWei = ethers.utils.parseEther(amount);
          const redeemable = await contract.methods.getRedeemableStakedPLS(account, amountWei).call();
          setEstimatedVPLS(ethers.utils.formatEther(redeemable));
        } else {
          setEstimatedVPLS("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated vPLS:", err);
      }
    };
    if (contract && account) fetchEstimate();
  }, [contract, account, amount]);

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = ethers.utils.parseEther(amount);
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert("PLSTR redeemed successfully!");
      setAmount("");
      fetchBalance();
    } catch (err) {
      setError(`Error redeeming PLSTR: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Redeem PLSTR</h2>
      <p className="text-gray-600 mb-2">Your PLSTR Balance: {plstrBalance} PLSTR</p>
      <p className="text-gray-600 mb-2">Estimated vPLS Receivable: {estimatedVPLS} vPLS</p>
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
        className={loading || !amount ? "btn-disabled" : "btn-primary"}
      >
        {loading ? "Processing..." : "Redeem PLSTR"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default RedeemPLSTR;
