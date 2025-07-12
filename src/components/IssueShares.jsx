import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, tokenAddresses, plsxABI, incABI } from "../web3";

const IssueShares = ({ web3, contract, account, chainId, contractSymbol, onTransactionSuccess }) => {
  const [amount, setAmount] = useState("");
  const [displayAmount, setDisplayAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [contractMetrics, setContractMetrics] = useState({
    totalSupply: "0",
    tokenBalance: "0",
  });
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

  const fetchContractMetrics = async () => {
    try {
      const metrics = await contract.methods.getContractMetrics().call();
      setContractMetrics({
        totalSupply: metrics.contractTotalSupply,
        tokenBalance: metrics[contractSymbol === "xBond" ? "plsxBalance" : "incBalance"],
      });
    } catch (err) {
      console.error("Fetch contract metrics error:", err);
      setError("Failed to load contract metrics");
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) {
      fetchTokenBalance();
      fetchContractMetrics();
    }
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
      alert(`Successfully issued ${contractSymbol} shares with ${amount} ${defaultToken}!`);
      setAmount("");
      setDisplayAmount("");
      fetchTokenBalance();
      fetchContractMetrics();
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

  const calculateEstimatedShares = () => {
    if (!amount || Number(amount) <= 0) return { shares: "0", fee: "0" };

    const FEE_BASIS_POINTS = 50; // 0.5%
    const BASIS_DENOMINATOR = 10000;
    const MIN_LIQUIDITY = web3.utils.toWei("1", "ether");

    const tokenAmount = toTokenUnits(amount, 18);
    if (BigInt(tokenAmount) < BigInt(MIN_LIQUIDITY)) return { shares: "0", fee: "0" };

    const fee = (BigInt(tokenAmount) * BigInt(FEE_BASIS_POINTS)) / BigInt(BASIS_DENOMINATOR);
    const feeToOriginAddress = fee / BigInt(2);
    const userContribution = BigInt(tokenAmount) - BigInt(fee);

    const totalSupply = BigInt(contractMetrics.totalSupply);
    const tokenBalance = BigInt(contractMetrics.tokenBalance);

    let shares;
    if (totalSupply === BigInt(0)) {
      shares = userContribution;
    } else {
      // Replicate Math.mulDiv with Floor rounding
      shares = (userContribution * totalSupply) / tokenBalance;
    }

    return {
      shares: fromUnits(shares.toString()),
      fee: fromUnits(fee.toString()),
    };
  };

  const { shares: estimatedShares, fee: feeAmount } = calculateEstimatedShares();

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
