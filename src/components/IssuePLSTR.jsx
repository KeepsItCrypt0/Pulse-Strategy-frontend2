import { useState, useEffect } from "react";
import { getVPLSContract } from "../web3";

const IssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [vPLSBalance, setVPLSBalance] = useState("0");
  const [estimatedPLSTR, setEstimatedPLSTR] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_ISSUE_AMOUNT = 1005; // Minimum issuance amount in vPLS

  const fetchBalance = async () => {
    try {
      setError("");
      console.log("fetchBalance called:", { web3: !!web3, account });
      if (!web3 || !account) {
        throw new Error("Web3 or account not initialized");
      }
      const vPLSContract = await getVPLSContract(web3);
      const balance = await vPLSContract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error("Invalid vPLS balance response");
      }
      const balanceEther = web3.utils.fromWei(balance, "ether");
      setVPLSBalance(balanceEther);
      console.log("vPLS balance fetched:", { balance, balanceEther });
    } catch (err) {
      const errorMsg = `Failed to load vPLS balance: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error("Failed to fetch vPLS balance:", err);
    }
  };

  useEffect(() => {
    if (web3 && account) {
      console.log("useEffect for fetchBalance triggered:", { web3: !!web3, account });
      fetchBalance();
    }
  }, [web3, account]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0) {
          const amountNum = Number(amount);
          const fee = amountNum * 0.005; // 0.5% fee
          const effectiveAmount = amountNum * 0.995; // Amount after fee
          const amountWei = web3.utils.toWei(effectiveAmount.toString(), "ether");
          const ratio = await contract.methods.getVPLSBackingRatio().call();
          const ratioDecimal = Number(web3.utils.fromWei(ratio, "ether"));
          const estimated = effectiveAmount * ratioDecimal;
          setEstimatedPLSTR(estimated.toFixed(3));
          setEstimatedFee(fee.toFixed(3));
          console.log("Estimated PLSTR fetched:", { amount, fee, effectiveAmount, ratio, estimated });
        } else {
          setEstimatedPLSTR("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated PLSTR:", err);
        setEstimatedPLSTR("0");
        setEstimatedFee("0");
      }
    };
    if (contract && web3) {
      console.log("useEffect for fetchEstimate triggered:", { contract: !!contract, web3: !!web3, amount });
      fetchEstimate();
    }
  }, [contract, web3, amount]);

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} vPLS`);
      }
      const amountWei = web3.utils.toWei(amount, "ether");
      console.log("Issuing PLSTR:", { amountWei });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setAmount("");
      await fetchBalance();
      console.log("PLSTR issued successfully");
    } catch (err) {
      const errorMsg = `Error issuing PLSTR: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error("Issue PLSTR error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue PLSTR</h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Estimated Fee (0.5%): <span className="text-purple-600">{estimatedFee} vPLS</span>
        </p>
        <p className="text-gray-600 mb-2">
          Estimated PLSTR Receivable: <span className="text-purple-600">{estimatedPLSTR} PLSTR</span>
        </p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter vPLS amount"
          className="w-full p-2 border rounded-lg"
          min="0"
          step="0.000000000000000001"
        />
        <p className="text-sm text-gray-600 mt-1">
          minimum <span className="text-purple-600 font-medium">1005 vPLS</span>
        </p>
        <p className="text-gray-600 mt-1">
          User vPLS Balance: <span className="text-purple-600">{Number(vPLSBalance).toFixed(3)} vPLS</span>
        </p>
      </div>
      <button
        onClick={handleIssue}
        disabled={loading || !amount || Number(amount) < MIN_ISSUE_AMOUNT}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Issue PLSTR"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
