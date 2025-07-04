import { useState, useEffect } from "react";
import { tokenAddresses, vPLS_ABI, PLStr_ABI } from "../web3"; // Added PLStr_ABI
import { formatNumber } from "../utils/format";

const AdminPanel = ({ contract, account, web3, chainId, contractSymbol, appIsController, onTransactionSuccess }) => {
  const [depositAmount, setDepositAmount] = useState("");
  const [displayDepositAmount, setDisplayDepositAmount] = useState("");
  const [vPlsBalance, setVPlsBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const CONTROLLER_ADDRESS = "0x6aaE8556C69b795b561CB75ca83aF6187d2F0AF5";

  // Null checks for props
  if (!web3 || !contract || !account || !chainId || !contractSymbol) {
    console.warn("AdminPanel: Missing required props", {
      web3: !!web3,
      contract: !!contract,
      account,
      chainId,
      contractSymbol,
    });
    return <div className="text-gray-600 p-6">Loading contract data...</div>;
  }

  if (chainId !== 369) {
    console.log("AdminPanel: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
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

  // Fetch vPLS balance for PLStr
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("AdminPanel loaded:", {
          contractSymbol,
          account,
          controllerAddress: CONTROLLER_ADDRESS,
          appIsController,
          contractAddress: contract.options.address,
        });

        if (contractSymbol === "PLStr") {
          const vPlsContract = new web3.eth.Contract(vPLS_ABI, tokenAddresses[369].vPLS);
          const balance = await vPlsContract.methods.balanceOf(account).call();
          setVPlsBalance(fromUnits(balance));
        }
      } catch (err) {
        console.error("Error fetching admin data:", {
          error: err.message,
          contractSymbol,
          contractAddress: contract.options.address,
        });
        setError("Failed to load admin data");
      }
    };
    if (web3 && contract && account) {
      fetchData();
    }
  }, [contract, account, web3, chainId, contractSymbol]);

  // Format input value with commas
  const formatInputValue = (value) => {
    if (!value) return "";
    const num = Number(value.replace(/,/g, ""));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 18,
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Handle deposit amount change
  const handleDepositAmountChange = (e) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^[0-9]*\.?[0-9]*$/.test(rawValue)) {
      setDepositAmount(rawValue);
      setDisplayDepositAmount(formatInputValue(rawValue));
    }
  };

  // Convert amount to vPLS units (18 decimals)
  const toTokenUnits = (amount) => {
    try {
      if (!amount || Number(amount) <= 0) return "0";
      return web3.utils.toWei(amount, "ether");
    } catch (err) {
      console.error("Error converting amount to token units:", { amount, error: err.message });
      return "0";
    }
  };

  const handleDepositTokens = async () => {
    if (contractSymbol !== "PLStr") return;
    if (!depositAmount || Number(depositAmount) <= 0 || Number(depositAmount) > Number(vPlsBalance)) {
      setError("Please enter a valid vPLS amount within your balance");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const tokenAmount = toTokenUnits(depositAmount);
      if (tokenAmount === "0") throw new Error("Invalid token amount");
      const tokenContract = new web3.eth.Contract(vPLS_ABI, tokenAddresses[369].vPLS);
      const allowance = await tokenContract.methods.allowance(account, contract.options.address).call();
      if (BigInt(allowance) < BigInt(tokenAmount)) {
        await tokenContract.methods.approve(contract.options.address, tokenAmount).send({ from: account });
      }
      await contract.methods.depositTokens(tokenAmount).send({ from: account });
      alert(`Successfully deposited ${depositAmount} vPLS!`);
      setDepositAmount("");
      setDisplayDepositAmount("");
      const balance = await tokenContract.methods.balanceOf(account).call();
      setVPlsBalance(fromUnits(balance));
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
    } catch (err) {
      setError(`Error depositing vPLS: ${err.message}`);
      console.error("Deposit tokens error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">Admin Panel - {contractSymbol}</h2>
      {contractSymbol === "PLStr" && (
        <>
          <h3 className="text-lg font-medium mb-2">Deposit vPLS</h3>
          <p className="text-gray-600 mb-2">
            vPLS Balance: <span className="text-[#4B0082]">{formatNumber(vPlsBalance)} vPLS</span>
          </p>
          <div className="mb-4">
            <label className="text-gray-600">Amount (vPLS)</label>
            <input
              type="text"
              value={displayDepositAmount}
              onChange={handleDepositAmountChange}
              placeholder="Enter vPLS amount"
              className="w-full p-2 border rounded-lg"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleDepositTokens}
            disabled={loading || !depositAmount || Number(depositAmount) <= 0}
            className="btn-primary mb-4"
          >
            {loading ? "Processing..." : "Deposit vPLS"}
          </button>
        </>
      )}
      {error && <p className="text-[#8B0000] mt-2">{error}</p>}
    </div>
  );
};

export default AdminPanel;
