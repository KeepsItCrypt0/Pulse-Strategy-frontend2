import { useState, useEffect } from "react";

const IssuePLSTR = ({ web3, contract, account }) => {
  const [issueAmount, setIssueAmount] = useState("");
  const [vplsBalance, setVplsBalance] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [estimatedPLSTR, setEstimatedPLSTR] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_ISSUE_AMOUNT = 1005; // Minimum issuance amount in vPLS

  const fetchVplsBalance = async () => {
    console.log("fetchVplsBalance called:", { web3: !!web3, contract: !!contract, account });
    if (!web3 || !contract || !account) {
      const errorMsg = "Missing dependencies: web3, contract, or account";
      setError(errorMsg);
      console.error(errorMsg, { web3: !!web3, contract: !!contract, account });
      return;
    }

    try {
      console.log("Calling redeemableVPLS for account:", account);
      const balance = await contract.methods.redeemableVPLS(account).call();
      console.log("Raw balance:", balance);
      const balanceEther = web3.utils.fromWei(balance, "ether");
      console.log("Formatted balance:", balanceEther);
      setVplsBalance(balanceEther);
      setError(""); // Clear errors
      console.log("VPLS balance fetched:", { balance, balanceEther });
    } catch (err) {
      const errorMsg = `Failed to fetch vPLS balance: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error(errorMsg, err);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered:", { web3: !!web3, contract: !!contract, account });
    if (web3 && contract && account) {
      fetchVplsBalance();
    } else {
      console.log("Skipping fetchVplsBalance due to missing dependencies");
    }
  }, [web3, contract, account]);

  useEffect(() => {
    const calculateEstimates = () => {
      try {
        const amount = Number(issueAmount) || 0;
        const fee = amount * 0.005; // 0.5% fee
        const plstr = amount - fee;
        setEstimatedFee(fee.toFixed(3));
        setEstimatedPLSTR(plstr.toFixed(3));
        console.log("Estimates calculated:", { issueAmount, fee, plstr });
      } catch (err) {
        console.error("Error calculating estimates:", err);
        setEstimatedFee("0");
        setEstimatedPLSTR("0");
      }
    };
    calculateEstimates();
  }, [issueAmount]);

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amount = Number(issueAmount);
      if (amount < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} vPLS`);
      }
      const amountWei = web3.utils.toWei(issueAmount, "ether");
      console.log("Issuing PLSTR:", { amountWei });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setIssueAmount("");
      await fetchVplsBalance(); // Refresh balance
      console.log("PLSTR issued successfully");
    } catch (err) {
      const errorMsg = `Error issuing PLSTR: ${err.message || "Unknown error"}`;
      setError(errorMsg);
      console.error(errorMsg, err);
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
          value={issueAmount}
          onChange={(e) => setIssueAmount(e.target.value)}
          placeholder="Enter vPLS amount"
          className="w-full p-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          minimum <span className="text-purple-600 font-medium">1005 vPLS</span>
        </p>
        <p className="text-gray-600 mt-1">
          User vPLS Balance: <span className="text-purple-600">{Number(vplsBalance).toFixed(3)} vPLS</span>
        </p>
      </div>
      <button
        onClick={handleIssue}
        disabled={loading || !issueAmount || Number(issueAmount) < MIN_ISSUE_AMOUNT}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Issue PLSTR"}
      </button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
