import { useState, useEffect } from "react";
import { getVPLSContract } from "../web3";

const IssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [vPLSBalance, setVPLSBalance] = useState("0");
  const [estimatedPLSTR, setEstimatedPLSTR] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [estimateError, setEstimateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = async () => {
    try {
      setError("");
      const vPLSContract = await getVPLSContract(web3);
      const balance = await vPLSContract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error("Invalid vPLS balance response");
      }
      setVPLSBalance(web3.utils.fromWei(balance, "ether"));
      console.log("vPLS balance fetched:", { balance });
    } catch (err) {
      console.error("Failed to fetch vPLS balance:", err);
      setError(`Failed to load vPLS balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account) fetchBalance();
  }, [web3, account]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        setEstimateError("");
        if (amount && Number(amount) > 0) {
          console.log("Fetching estimate for amount:", amount);
          const amountNum = Number(amount);
          const fee = amountNum * 0.005; // 0.5% fee
          const effectiveAmount = amountNum * 0.995; // Amount after fee
          const amountWei = web3.utils.toWei(effectiveAmount.toFixed(18), "ether");
          const ratio = await contract.methods.getVPLSBackingRatio().call();
          console.log("Backing ratio raw:", ratio);
          const ratioDecimal = Number(web3.utils.fromWei(ratio, "ether"));
          const estimated = effectiveAmount * ratioDecimal;
          setEstimatedPLSTR(estimated.toFixed(18));
          setEstimatedFee(fee.toFixed(18));
          console.log("Estimate calculated:", {
            amount: amountNum,
            fee,
            effectiveAmount,
            ratioDecimal,
            estimatedPLSTR: estimated,
          });
        } else {
          setEstimatedPLSTR("0");
          setEstimatedFee("0");
          console.log("No valid amount, resetting estimates");
        }
      } catch (err) {
        console.error("Failed to fetch estimated PLSTR:", err);
        setEstimateError(`Failed to calculate estimate: ${err.message || "Unknown error"}`);
        setEstimatedPLSTR("0");
        setEstimatedFee("0");
      }
    };
    if (contract && web3 && account) {
      console.log("Running fetchEstimate with amount:", amount);
      fetchEstimate();
    }
  }, [contract, web3, account, amount]);

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const vPLSContract = await getVPLSContract(web3);
      const amountWei = web3.utils.toWei(amount, "ether");
      await vPLSContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setAmount("");
      fetchBalance();
      console.log("PLSTR issued:", { amountWei });
    } catch (err) {
      setError(`Error issuing PLSTR: ${err.message || "Unknown error"}`);
      console.error("Issue PLSTR error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue PLSTR</h2>
      <p className="text-gray-600 mb-2">Your vPLS Balance: {vPLSBalance} vPLS</p>
      <p className="text-gray-600 mb-2">Estimated PLSTR Receivable: {estimatedPLSTR} PLSTR</p>
      <p className="text-gray-600 mb-2">Estimated Fee (0.5%): {estimatedFee} vPLS</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter vPLS amount"
        className="w-full p-2 border rounded-lg mb-4"
        min="0"
        step="0.000000000000000001"
      />
      <button
        onClick={handleIssue}
        disabled={loading || !amount || Number(amount) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Issue PLSTR"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
      {estimateError && <p className="text-red-400 mt-2">{estimateError}</p>}
    </div>
  );
};

export default IssuePLSTR;
