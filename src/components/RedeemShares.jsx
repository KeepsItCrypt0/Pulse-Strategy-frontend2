import { useState, useEffect } from "react";
import { contractAddresses, tokenAddresses, vPLS_ABI, PLStr_ABI, plsxABI, incABI, xBond_ABI, iBond_ABI } from "../web3";
import { formatNumber } from "../utils/format";

const RedeemShares = ({ contract, account, web3, chainId, contractSymbol, onTransactionSuccess }) => {
  const [redeemAmount, setRedeemAmount] = useState("");
  const [displayRedeemAmount, setDisplayRedeemAmount] = useState("");
  const [redeemableValue, setRedeemableValue] = useState("0");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tokens = {
    PLStr: { symbol: "vPLS", address: tokenAddresses[369].vPLS, redeemMethod: "redeemPLStr" },
    xBond: { symbol: "PLSX", address: tokenAddresses[369].PLSX, redeemMethod: "redeemShares" },
    iBond: { symbol: "INC", address: tokenAddresses[369].INC, redeemMethod: "redeemShares" },
  };

  const fromUnits = (balance) => {
    try {
      if (!balance || balance === "0") return "0";
      return web3.utils.fromWei(balance.toString(), "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, error: err.message });
      return "0";
    }
  };

  const toTokenUnits = (amount) => {
    try {
      if (!amount || Number(amount) <= 0) return "0";
      return web3.utils.toWei(amount, "ether");
    } catch (err) {
      console.error("Error converting amount to token units:", { amount, error: err.message });
      return "0";
    }
  };

  const formatInputValue = (value) => {
    if (!value) return "";
    const [intPart, decPart] = value.replace(/,/g, "").split(".");
    if (intPart === undefined || intPart === "") return decPart !== undefined ? `.${decPart}` : "";
    const formattedInt = new Intl.NumberFormat("en-US").format(Number(intPart));
    return decPart !== undefined ? `${formattedInt}.${decPart}` : (intPart ? formattedInt : "");
  };

  const handleRedeemAmountChange = (e) => {
    let rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setRedeemAmount(rawValue);
      setDisplayRedeemAmount(formatInputValue(rawValue));
    }
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) {
      console.warn("fetchUserData: Invalid inputs", { web3: !!web3, contract: !!contract, account, chainId, contractSymbol });
      return;
    }
    try {
      const balance = await contract.methods.balanceOf(account).call();
      let backingTokenBalance, totalSupply;

      if (contractSymbol === "PLStr") {
        const metrics = await contract.methods.getBasicMetrics().call();
        const { contractTotalSupply, vPlsBalance } = Array.isArray(metrics)
          ? { contractTotalSupply: metrics[0], vPlsBalance: metrics[1] }
          : metrics;
        totalSupply = contractTotalSupply;
        backingTokenBalance = vPlsBalance;
      } else if (contractSymbol === "xBond") {
        try {
          const metrics = await contract.methods.getContractMetrics().call();
          const { contractTotalSupply, plsxBalance } = Array.isArray(metrics)
            ? { contractTotalSupply: metrics[0], plsxBalance: metrics[1] }
            : metrics;
          totalSupply = contractTotalSupply;
          backingTokenBalance = plsxBalance;
        } catch (err) {
          console.warn("getContractMetrics failed for xBond, using balanceOf:", err.message);
          const plsxContract = new web3.eth.Contract(plsxABI, tokenAddresses[369].PLSX);
          backingTokenBalance = await plsxContract.methods.balanceOf(contractAddresses[369].xBond).call();
          totalSupply = await contract.methods.totalSupply().call();
        }
      } else if (contractSymbol === "iBond") {
        try {
          const metrics = await contract.methods.getContractMetrics().call();
          const { contractTotalSupply, incBalance } = Array.isArray(metrics)
            ? { contractTotalSupply: metrics[0], incBalance: metrics[1] }
            : metrics;
          totalSupply = contractTotalSupply;
          backingTokenBalance = incBalance;
        } catch (err) {
          console.warn("getContractMetrics failed for iBond, using balanceOf:", err.message);
          const incContract = new web3.eth.Contract(incABI, tokenAddresses[369].INC);
          backingTokenBalance = await incContract.methods.balanceOf(contractAddresses[369].iBond).call();
          totalSupply = await contract.methods.totalSupply().call();
        }
      }

      let redeemable = "0";
      if (Number(totalSupply) > 0) {
        redeemable = (BigInt(balance) * BigInt(backingTokenBalance)) / BigInt(totalSupply);
      }

      setBalance(fromUnits(balance));
      setRedeemableValue(fromUnits(redeemable));
    } catch (err) {
      console.error("Error fetching redeem data:", {
        error: err.message,
        contractSymbol,
        contractAddress: contract.options.address,
      });
      setError("Failed to load redeem data");
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) {
      fetchUserData();
    }
  }, [web3, contract, account, chainId, contractSymbol]);

  const handleRedeem = async () => {
    if (!redeemAmount || Number(redeemAmount) <= 0 || Number(redeemAmount) > Number(balance)) {
      setError(`Please enter a valid ${contractSymbol} amount within your balance`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const tokenAmount = toTokenUnits(redeemAmount);
      if (tokenAmount === "0") throw new Error("Invalid token amount");
      await contract.methods[tokens[contractSymbol].redeemMethod](tokenAmount).send({ from: account });
      alert(`Successfully redeemed ${redeemAmount} ${contractSymbol} for ${tokens[contractSymbol].symbol}!`);
      setRedeemAmount("");
      setDisplayRedeemAmount("");
      await fetchUserData();
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
    } catch (err) {
      setError(`Error redeeming ${contractSymbol}: ${err.message}`);
      console.error("Redeem error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369) {
    return (
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
        <p className="text-[#8B0000]">Please connect to PulseChain (chain ID 369)</p>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">
        Redeem {contractSymbol} for {tokens[contractSymbol]?.symbol}
      </h2>
      <p className="text-gray-600 mb-2">
        {contractSymbol} Balance: <span className="text-[#4B0082]">{formatNumber(balance)} {contractSymbol}</span>
      </p>
      <p className="text-gray-600 mb-2">
        Redeemable Value: <span className="text-[#4B0082]">{formatNumber(redeemableValue)} {tokens[contractSymbol]?.symbol}</span>
      </p>
      <div className="mb-4">
        <label className="text-gray-600">Amount ({contractSymbol})</label>
        <input
          type="text"
          value={displayRedeemAmount}
          onChange={handleRedeemAmountChange}
          placeholder={`Enter ${contractSymbol} amount`}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
      </div>
      <button
        onClick={handleRedeem}
        disabled={loading || !redeemAmount || Number(redeemAmount) <= 0}
        className="btn-primary mb-4"
      >
        {loading ? "Processing..." : `Redeem ${contractSymbol}`}
      </button>
      {error && <p className="text-[#8B0000] mt-2">{error}</p>}
    </div>
  );
};

export default RedeemShares;
