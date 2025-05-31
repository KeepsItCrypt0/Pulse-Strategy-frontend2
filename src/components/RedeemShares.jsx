import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const RedeemShares = ({ contract, account, web3, chainId }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [shareBalance, setShareBalance] = useState("0");
  const [estimatedToken, setEstimatedToken] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = async () => {
    try {
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      setShareBalance(web3.utils.fromWei(balance, "ether"));
      console.log(`${chainId === 1 ? "PLSTR" : "xBOND"} balance fetched:`, { balance });
    } catch (err) {
      console.error(`Failed to fetch ${chainId === 1 ? "PLSTR" : "xBOND"} balance:`, err);
      setError(`Failed to load ${chainId === 1 ? "PLSTR" : "xBOND"} balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId) fetchBalance();
  }, [contract, account, web3, chainId]);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        if (amount && Number(amount) > 0 && contract && web3 && account) {
          const amountWei = web3.utils.toWei(amount, "ether");
          let redeemable;
          if (chainId === 1) {
            const normalizedAccount = web3.utils.toChecksumAddress(account);
            redeemable = await contract.methods
              .getRedeemableStakedPLS(normalizedAccount, amountWei)
              .call({ from: normalizedAccount });
          } else {
            redeemable = await contract.methods
              .getRedeemablePLSX(account, amountWei)
              .call({ from: account });
          }
          setEstimatedToken(web3.utils.fromWei(redeemable || "0", "ether"));
          console.log(`Estimated ${chainId === 1 ? "vPLS" : "PLSX"} fetched:`, { amount, redeemable });
        } else {
          setEstimatedToken("0");
        }
      } catch (err) {
        console.error(`Failed to fetch estimated ${chainId === 1 ? "vPLS" : "PLSX"}:`, err);
        setError(`Failed to fetch estimated ${chainId === 1 ? "vPLS" : "PLSX"}: ${err.message || "Contract execution failed"}`);
      }
    };
    if (contract && account && web3 && chainId) fetchEstimate();
  }, [contract, account, amount, web3, chainId]);

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(
        rawValue === ""
          ? ""
          : new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 18,
              minimumFractionDigits: 0,
            }).format(Number(rawValue))
      );
    }
  };

  const handleRedeem = async () => {
    setLoading(true);
    setError("");
    try {
      const amountWei = web3.utils.toWei(amount, "ether");
      await contract.methods.redeemShares(amountWei).send({ from: account });
      alert(`${chainId === 1 ? "PLSTR" : "xBOND"} redeemed successfully!`);
      setAmount("");
      setDisplayAmount("");
      fetchBalance();
      console.log(`${chainId === 1 ? "PLSTR" : "xBOND"} redeemed:`, { amountWei });
    } catch (err) {
      setError(`Error redeeming ${chainId === 1 ? "PLSTR" : "xBOND"}: ${err.message || "Unknown error"}`);
      console.error("Redeem shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">
        Redeem {chainId === 1 ? "PLSTR" : "xBOND"}
      </h2>
      <p className="text-gray-600 mb-2">
        Your {chainId === 1 ? "PLSTR" : "xBOND"} Balance: {formatNumber(shareBalance)} {chainId === 1 ? "PLSTR" : "xBOND"}
      </p>
      <p className="text-gray-600 mb-2">
        Estimated {chainId === 1 ? "vPLS" : "PLSX"} Receivable: {formatNumber(estimatedToken)} {chainId === 1 ? "vPLS" : "PLSX"}
      </p>
      <input
        type="text"
        value={displayAmount}
        onChange={handleAmountChange}
        placeholder={`Enter ${chainId === 1 ? "PLSTR" : "xBOND"} amount`}
        className="w-full p-2 border rounded-lg mb-4"
      />
      <button
        onClick={handleRedeem}
        disabled={loading || !amount || Number(amount) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : `Redeem ${chainId === 1 ? "PLSTR" : "xBOND"}`}
      </button>
      {error && <p className="text-red-700 mt-2">{error}</p>}
    </div>
  );
};

export default RedeemShares;
