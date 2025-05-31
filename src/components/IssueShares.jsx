import { useState, useEffect } from "react";
import { getTokenContract } from "../web3";
import { formatNumber } from "../utils/format";

const IssueShares = ({ web3, contract, account, chainId }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [estimatedShares, setEstimatedShares] = useState("0");
  const [estimatedFee, setEstimatedFee] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const MIN_ISSUE_AMOUNT = 10;

  const fetchBalance = async () => {
    if (!web3 || !account || !chainId) {
      setError("Please ensure your wallet is connected and network is selected.");
      return;
    }
    try {
      setError("");
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const balance = await tokenContract.methods.balanceOf(account).call();
      setTokenBalance(web3.utils.fromWei(balance, "ether"));
      console.log(`${chainId === 1 ? "vPLS" : "PLSX"} balance fetched:`, { balance });
    } catch (err) {
      console.error(`Failed to fetch ${chainId === 1 ? "vPLS" : "PLSX"} balance:`, err);
      setError(`Failed to load ${chainId === 1 ? "vPLS" : "PLSX"} balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account && chainId) fetchBalance();
  }, [web3, account, chainId]);

  useEffect(() => {
    let timeout;
    const fetchEstimate = async () => {
      try {
        setError("");
        if (amount && Number(amount) > 0 && contract && web3) {
          const amountNum = Number(amount);
          if (amountNum < MIN_ISSUE_AMOUNT) {
            throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${chainId === 1 ? "vPLS" : "PLSX"}`);
          }
          const amountWei = web3.utils.toWei(amount, "ether");
          let shares, fee;
          if (chainId === 1) {
            // PLSTR: Use calculateSharesReceived with 0.5% fee
            const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
            shares = (typeof result === "object" ? result.shares || result[0] : result).toString();
            fee = web3.utils.toWei((amountNum * 0.005).toString(), "ether"); // 0.5% fee
          } else {
            // xBOND: Calculate 5% fee and 1:1 shares after fee
            fee = web3.utils.toWei((amountNum * 0.05).toString(), "ether"); // 5% fee
            shares = web3.utils.toWei((amountNum * 0.95).toString(), "ether"); // 95% of input as shares (1:1)
            // Log calculateSharesReceived for debugging
            try {
              const result = await contract.methods.calculateSharesReceived(amountWei).call({ from: account });
              console.log("xBOND calculateSharesReceived result:", result);
            } catch (err) {
              console.error("Failed to fetch xBOND calculateSharesReceived:", err);
            }
          }
          setEstimatedShares(web3.utils.fromWei(shares, "ether"));
          setEstimatedFee(web3.utils.fromWei(fee, "ether"));
          console.log("Estimated shares fetched:", { amount, shares, fee, chainId });
        } else {
          setEstimatedShares("0");
          setEstimatedFee("0");
        }
      } catch (err) {
        console.error("Failed to fetch estimated shares:", err);
        setError(`Failed to fetch estimated shares: ${err.message || "Contract execution failed"}`);
      }
    };

    if (contract && web3 && chainId && account) {
      timeout = setTimeout(fetchEstimate, 500);
    }
    return () => clearTimeout(timeout);
  }, [contract, web3, amount, chainId, account]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9.]/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      const numValue = rawValue === "" ? 0 : Number(rawValue);
      setAmount(rawValue);
      setDisplayAmount(
        rawValue === ""
          ? ""
          : new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 18,
              minimumFractionDigits: 0,
            }).format(numValue)
      );
      if (numValue >= MIN_ISSUE_AMOUNT) {
        setError("");
      }
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const amountNum = Number(amount);
      if (amountNum < MIN_ISSUE_AMOUNT) {
        throw new Error(`Amount must be at least ${MIN_ISSUE_AMOUNT} ${chainId === 1 ? "vPLS" : "PLSX"}`);
      }
      const tokenContract = await getTokenContract(web3);
      if (!tokenContract) throw new Error("Failed to initialize token contract");
      const amountWei = web3.utils.toWei(amount, "ether");
      await tokenContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert(`${chainId === 1 ? "PLSTR" : "xBOND"} issued successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
      console.log(`${chainId === 1 ? "PLSTR" : "xBOND"} issued:`, { amountWei });
    } catch (err) {
      setError(`Error issuing ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">
        Issue {chainId === 1 ? "PLSTR" : "xBOND"}
      </h2>
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Estimated Fee: <span className="text-purple-600">{formatNumber(estimatedFee)} {chainId === 1 ? "vPLS" : "PLSX"}</span>
          {chainId === 1 ? (
            <span className="text-sm text-gray-500 ml-2">(0.5% fee applied)</span>
          ) : (
            <span className="text-sm text-gray-500 ml-2">(5% fee applied)</span>
          )}
        </p>
        <p className="text-gray-600 mb-2">
          Estimated {chainId === 1 ? "PLSTR" : "xBOND"} Receivable: <span className="text-purple-600">{formatNumber(estimatedShares)} {chainId === 1 ? "PLSTR" : "xBOND"}</span>
        </p>
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder={`Enter ${chainId === 1 ? "vPLS" : "PLSX"} amount`}
          className="w-full p-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600 mt-1">
          Minimum <span className="text-purple-600 font-medium">{MIN_ISSUE_AMOUNT} {chainId === 1 ? "vPLS" : "PLSX"}</span>
        </p>
        <p className="text-gray-600 mt-1">
          User {chainId === 1 ? "vPLS" : "PLSX"} Balance: <span className="text-purple-600">{formatNumber(tokenBalance)} {chainId === 1 ? "vPLS" : "PLSX"}</span>
        </p>
      </div>
      <button
        onClick={handleIssue}
        disabled={loading || !amount || Number(amount) < MIN_ISSUE_AMOUNT}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Issue ${chainId === 1 ? "PLSTR" : "xBOND"}`}
      </button>
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default IssueShares;
