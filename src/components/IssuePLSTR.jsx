import { useState, useEffect } from "react";

const IssuePLSTR = ({ web3, contract, vplsContract, account }) => {
  const [issueAmount, setIssueAmount] = useState("");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [estimatedPLSTR, setEstimatedPLSTR] = useState("0");
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_ISSUE_AMOUNT = 1005; // Minimum issuance amount in vPLS

  const checkAllowance = async () => {
    try {
      if (!vplsContract || !account) return;
      const allowance = await vplsContract.methods
        .allowance(account, contract.options.address)
        .call();
      setIsApproved(Number(web3.utils.fromWei(allowance, "ether")) >= MIN_ISSUE_AMOUNT);
    } catch (err) {
      console.error("Error checking allowance:", err);
    }
  };

  useEffect(() => {
    if (web3 && vplsContract && account) {
      checkAllowance();
    }
  }, [web3, vplsContract, account]);

  useEffect(() => {
    const calculateEstimates = () => {
      try {
        const amount = Number(issueAmount) || 0;
        const fee = amount * 0.005; // 0.5% fee
        const plstr = amount - fee;
        setEstimatedFee(fee.toFixed(3));
        setEstimatedPLSTR(plstr.toFixed(3));
      } catch (err) {
        console.error("Error calculating estimates:", err);
        setEstimatedFee("0");
        setEstimatedPLSTR("0");
      }
    };
    calculateEstimates();
  }, [issueAmount]);

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(issueAmount || "0", "ether");
      await vplsContract.methods
        .approve(contract.options.address, amountWei)
        .send({ from: account });
      setIsApproved(true);
      alert("vPLS approved successfully!");
      console.log("vPLS approved:", { amountWei });
    } catch (err) {
      setError(`Error approving vPLS: ${err.message || "Unknown error"}`);
      console.error("Approve error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(issueAmount, "ether");
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setIssueAmount("");
      setIsApproved(false);
      checkAllowance();
      console.log("PLSTR issued:", { amountWei });
    } catch (err) {
      setError(`Error issuing PLSTR: ${err.message || "Unknown error"}`);
      console.error("Issue error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isValidAmount = Number(issueAmount) >= MIN_ISSUE_AMOUNT;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue PLSTR</h2>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Amount of vPLS to Issue</label>
        <input
          type="number"
          value={issueAmount}
          onChange={(e) => setIssueAmount(e.target.value)}
          placeholder="Enter vPLS amount"
          className="w-full p-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum issuance amount is <span className="text-purple-600 font-medium">1005 vPLS</span>.
        </p>
      </div>
      <div className="mb-4">
        <p className="text-gray-600">
          Estimated Fee (0.5%): <span className="text-purple-600">{estimatedFee} vPLS</span>
        </p>
        <p className="text-gray-600">
          Estimated PLSTR Receivable: <span className="text-purple-600">{estimatedPLSTR} PLSTR</span>
        </p>
      </div>
      <div className="flex space-x-4">
        {!isApproved && (
          <button
            onClick={handleApprove}
            disabled={loading || !issueAmount || !isValidAmount}
            className="btn-primary"
          >
            {loading ? "Processing..." : "Approve vPLS"}
          </button>
        )}
        <button
          onClick={handleIssue}
          disabled={loading || !isApproved || !isValidAmount}
          className="btn-primary"
        >
          {loading ? "Processing..." : "Issue PLSTR"}
        </button>
      </div>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
