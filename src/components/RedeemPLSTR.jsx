import { useState, useEffect } from "react";

const RedeemPLSTR = ({ contract, account, web3 }) => {
  const [amount, setAmount] = useState("");
  const [plstrBalance, setPlstrBalance] = useState("0");
  const [estimatedVPLS, setEstimatedVPLS] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = async () => {
    try {
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error("Invalid PLSTR balance response");
      }
      setPlstrBalance(web3.utils.fromWei(balance, "ether"));
      console.log("PLSTR balance fetched:", { balance });
    } catch (err) {
      console.error("Failed to fetch PLSTR balance:", err);
      setError(`Failed to load PLSTR balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account && web3) fetchBalance();
  }, [contract, account, web3]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0) {
          const amountWei = web3.utils.toWei(amount, "ether");
          const redeemable = await contract.methods.getRedeemableStakedPLS(account, amountWei).call();
          if (redeemable === undefined || redeemable === null) {
            throw new Error("Invalid redeemable vPLS response");
          }
          setEstimatedVPLS(web3.utils.fromWei(redeemable, "ether"));
          console.log("Estimated vPLS fetched:", { redeemable });
        } else {
          setEstimatedVPLS("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated vPLS:", err);
      }
    };
    if (contract && account && web3) fetchEstimate();
  }, [contract, account, amount, web3]);

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert("PLSTR redeemed successfully!");
      setAmount("");
      fetchBalance();
      console.log("PLSTR redeemed:", { amountWei });
    } catch (err) {
      setError(`Error redeeming PLSTR: ${err.message || "Unknown error"}`);
      console.error("Redeem PLSTR error:", err);
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
