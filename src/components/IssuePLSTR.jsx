import { useState, useEffect } from "react";
import { getVPLSContract } from "../web3";
import { formatNumber } from "../utils/format";

const IssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [vPLSBalance, setVPLSBalance] = useState("0");
  const [estimatedPLSTR, setEstimatedPLSTR] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_ISSUE_AMOUNT = 1005; // Minimum issuance amount in vPLS

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
        if (amount && Number(amount) > 0) {
          const amountNum = Number(amount);
          const fee = amountNum * 0.005; // 0.5% fee
          const effectiveAmount = amountNum * 0.995; // Amount after fee
          const amountWei = web3.utils.toWei(effectiveAmount.toString(), "ether");
          const ratio = await contract.methods.getVPLSBackingRatio().call();
          const ratioDecimal = Number(web3.utils.fromWei(ratio, "ether"));
          const estimated = effectiveAmount * ratioDecimal;
          setEstimatedPLSTR(estimated.toString());
          setEstimatedFee(fee.toString());
          console.log("Estimated PLSTR fetched:", { amount, fee, effectiveAmount, ratio, estimated });
        } else {
          setEstimatedPLSTR("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated PLSTR:", err);
      }
    };
    if (contract && web3) fetchEstimate();
  }, [contract, web3, amount]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^-?\d*\.?\d*$/.test(rawValue)) {
      setAmount(rawValue);
      if (rawValue === "" || isNaN(rawValue)) {
        setDisplayAmount("");
      } else {
        setDisplayAmount(
          new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 18,
            minimumFractionDigits: 0,
          }).format(rawValue)
        );
      }
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} vPLS`);
      }
      const vPLSContract = await getVPLSContract(web3);
      const amountWei = web3.utils.toWei(amount, "ether");
      await vPLSContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setAmount("");
      setDisplayAmount("");
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
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Estimated Fee (0.5%): <span className="text-purple-600">{formatNumber(estimatedFee)} vPLS</span>
        </p>
        <p className="text-gray-600 mb-2">
          Estimated PLSTR Receivable: <span className="text-purple-600">{formatNumber(estimatedPLSTR)} PLSTR</span>
        </p>
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder="Enter vPLS amount"
          className="w-full p-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          minimum <span className="text-purple-600 font-medium">1005 vPLS</span>
        </p>
        <p className="text-gray-600 mt-1">
          User vPLS Balance: <span className="text-purple-600">{formatNumber(vPLSBalance)} vPLS</span>
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
