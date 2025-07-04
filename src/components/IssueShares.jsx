import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, tokenAddresses, plsxABI, incABI } from "../web3";

const IssueShares = ({ web3, contract, account, chainId, contractSymbol, onTransactionSuccess }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Null checks for props
  if (!web3 || !contract || !account || !chainId || !contractSymbol) {
    console.warn("IssueShares: Missing required props", { web3, contract, account, chainId, contractSymbol });
    return <div className="text-gray-600 p-6">Loading contract data...</div>;
  }

  const tokenConfig = {
    xBond: [{ symbol: "PLSX", address: tokenAddresses[369].PLSX, decimals: 18, abi: plsxABI }],
    iBond: [{ symbol: "INC", address: tokenAddresses[369].INC, decimals: 18, abi: incABI }],
  };

  const tokens = tokenConfig[contractSymbol] || [];
  const defaultToken = tokens[0]?.symbol || "";

  if (!tokens.length || contractSymbol === "PLStr") {
    console.error("IssueShares: Invalid token config or PLStr not supported", { contractSymbol });
    return <div className="text-red-600 p-6">Error: Invalid contract configuration</div>;
  }

  const fromUnits = (balance) => {
    try {
      if (!balance || balance === "0") return "0";
      return web3.utils.fromWei(balance.toString(), "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, error: err.message });
      return "0";
    }
  };

  const toTokenUnits = (amount, decimals) => {
    try {
      if (!amount || Number(amount) <= 0) return "0";
      return web3.utils.toWei(amount, "ether");
    } catch (err) {
      console.error("Error converting amount to token units:", { amount, decimals, err });
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

  const handleAmountChange = (e) => {
    let rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setAmount(rawValue);
      setDisplayAmount(formatInputValue(rawValue));
    }
  };

  const fetchTokenBalance = async () => {
    try {
      const token = tokens[0];
      const tokenContract = new web3.eth.Contract(token.abi, token.address);
      const balance = await tokenContract.methods.balanceOf(account).call();
      setTokenBalance(fromUnits(balance));
    } catch (err) {
      setError(`Failed to load ${defaultToken} balance: ${err.message}`);
      console.error("Fetch token balance error:", err);
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) fetchTokenBalance();
  }, [web3, contract, account, chainId, contractSymbol]);

  if (chainId !== 369) {
    console.log("IssueShares: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
  }

  const handleIssueShares = async () => {
    if (!amount || Number(amount) <= 0 || Number(amount) > Number(tokenBalance)) {
      setError(`Please enter a valid amount within your ${defaultToken} balance`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = tokens[0];
      const tokenAmount = toTokenUnits(amount, token.decimals);
      if (tokenAmount === "0") throw new Error("Invalid token amount");
      const tokenContract = new web3.eth.Contract(token.abi, token.address);
      const allowance = await tokenContract.methods.allowance(account, contractAddresses[369][contractSymbol]).call();
      if (BigInt(allowance) < BigInt(tokenAmount)) {
        await tokenContract.methods.approve(contractAddresses[369][contractSymbol], tokenAmount).send({ from: account });
      }
      await contract.methods.issueShares(tokenAmount).send({ from: account });
      alert(`Successfully issued ${contractSymbol} shares with ${amount} ${token.symbol}!`);
      setAmount("");
      setDisplayAmount("");
      fetchTokenBalance();
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
    } catch (err) {
      setError(`Error issuing shares: ${err.message}`);
      console.error("Issue shares error:", err);
    } finally {
      setLoading(false);
    }
  };

  const estimatedShares = amount ? (Number(amount) * 0.995).toFixed(6) : "0";
  const feeAmount = amount ? (Number(amount) * 0.005).toFixed(6) : "0";

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">Issue {contractSymbol}</h2>
      <p className="text-gray-600 mb-2">
        {defaultToken} Balance: <span className="text-[#4B0082]">{formatNumber(tokenBalance)} {defaultToken}</span>
      </p>
      <div className="mb-4">
        <label className="text-gray-600">Token</label>
        <input
          type="text"
          value={defaultToken}
          readOnly
          className="w-full p-2 border rounded-lg bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="text-gray-600">Amount ({defaultToken})</label>
        <input
          type="text"
          value={displayAmount}
          onChange={handleAmountChange}
          placeholder={`Enter ${defaultToken} amount`}
          className="w-full p-2 border rounded-lg"
          disabled={loading}
        />
        <p className="text-gray-600 mt-2">
          Estimated {contractSymbol} (after 0.5% fee): <span className="text-[#4B0082]">{formatNumber(estimatedShares)}</span>
        </p>
        <p className="text-gray-600 mt-1">
          Fee (0.5%): <span className="text-[#4B0082]">{formatNumber(feeAmount)} {defaultToken}</span>
        </p>
      </div>
      <button
        onClick={handleIssueShares}
        disabled={loading || !amount || Number(amount) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Issue"}
      </button>
      {error && <p className="text-[#8B0000] mt-2">{error}</p>}
    </div>
  );
};

export default IssueShares;
