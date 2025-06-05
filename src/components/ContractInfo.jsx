import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const ContractInfo = ({ contract, web3, chainId }) => {
  const [info, setInfo] = useState({
    balance: "0",
    issuancePeriod: "0",
    totalIssued: "0",
    totalBurned: "0",
    plsxBackingRatio: "0",
    vplsBackingRatio: "0",
    plsxAddedByStrategy: "0", // For chainId 369
    vplsAddedByStrategy: "0", // New state for chainId 1
  });
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    if (!contract || !web3 || !chainId) {
      setError("Contract or Web3 not initialized");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const totalIssued = await contract.methods.totalSupply().call();
      let newInfo = {
        balance: "0",
        issuancePeriod: "0",
        totalIssued: web3.utils.fromWei(totalIssued || "0", "ether"),
        totalBurned: "0",
        plsxBackingRatio: "0",
        vplsBackingRatio: "0",
        plsxAddedByStrategy: "0",
        vplsAddedByStrategy: "0", // Initialize new field
      };

      if (chainId === 1) {
        // PLSTR: Use getContractInfo and getVPLSBackingRatio
        const { contractBalance, remainingIssuancePeriod } = await contract.methods.getContractInfo().call();
        const vplsRatio = await contract.methods.getVPLSBackingRatio().call();
        const vplsRatioDecimal = web3.utils.fromWei(vplsRatio || "0", "ether");
        const balanceNum = Number(web3.utils.fromWei(contractBalance || "0", "ether"));
        const totalSupplyNum = Number(web3.utils.fromWei(totalIssued || "0", "ether"));
        const vplsAdded = balanceNum - totalSupplyNum; // Calculate vPLS Added by Strategy
        console.log("Raw contractBalance (Wei):", contractBalance);
        console.log("Contract vPLS Balance (Ether):", balanceNum);
        console.log("Raw totalIssued (Wei):", totalIssued);
        console.log("vPLS Added by Strategy (Ether):", vplsAdded);
        newInfo = {
          ...newInfo,
          balance: balanceNum.toString(),
          issuancePeriod: remainingIssuancePeriod || "0",
          vplsBackingRatio: vplsRatioDecimal,
          vplsAddedByStrategy: vplsAdded.toString(), // Add to state
        };
      } else if (chainId === 369) {
        // xBOND: Use getContractMetrics and getContractHealth
        const { contractPLSXBalance, totalBurned, remainingIssuancePeriod, currentTotalSupply } = await contract.methods.getContractMetrics().call();
        const { plsxBackingRatio } = await contract.methods.getContractHealth().call();
        const balanceNum = Number(web3.utils.fromWei(contractPLSXBalance || "0", "ether"));
        const issuedNum = Number(web3.utils.fromWei(totalIssued || "0", "ether"));
        const totalSupplyNum = Number(web3.utils.fromWei(currentTotalSupply || "0", "ether"));
        const plsxAdded = balanceNum - totalSupplyNum; // Calculate PLSX Added by Strategy
        console.log("Raw contractPLSXBalance (Wei):", contractPLSXBalance);
        console.log("Contract PLSX Balance (Ether):", balanceNum);
        console.log("Raw totalIssued (Wei):", totalIssued);
        console.log("Raw currentTotalSupply (Wei):", currentTotalSupply);
        console.log("PLSX Added by Strategy (Ether):", plsxAdded);
        newInfo = {
          ...newInfo,
          balance: balanceNum.toString(),
          issuancePeriod: remainingIssuancePeriod || "0",
          totalBurned: web3.utils.fromWei(totalBurned || "0", "ether"),
          plsxBackingRatio: web3.utils.fromWei(plsxBackingRatio || "0", "ether"),
          plsxAddedByStrategy: plsxAdded.toString(),
        };
      }

      setInfo(newInfo);
      console.log("Contract info fetched:", newInfo);
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      setError(`Failed to load contract data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId) fetchInfo();
  }, [contract, web3, chainId]);

  useEffect(() => {
    const updateCountdown = () => {
      const seconds = Number(info.issuancePeriod);
      if (seconds <= 0) {
        setCountdown("Issuance period ended");
        return;
      }
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setCountdown(`${days}d ${hours}h ${minutes}m ${secs}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [info.issuancePeriod]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Contract Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchInfo}
            className="mt-2 text-purple-300 hover:text-red-300 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-600">
            <strong>{chainId === 1 ? "vPLS Balance" : "PLSX Balance"}:</strong>{" "}
            {formatNumber(info.balance)} {chainId === 1 ? "vPLS" : "PLSX"}
          </p>
          <p className="text-gray-600">
            <strong>{chainId === 1 ? "PLSTR Issued" : "xBOND Issued"}:</strong>{" "}
            {formatNumber(info.totalIssued)} {chainId === 1 ? "PLSTR" : "xBOND"}
          </p>
          {chainId === 1 && (
            <>
              <p className="text-gray-600">
                <strong>vPLS Backing Ratio:</strong>{" "}
                {Number.isInteger(Number(info.vplsBackingRatio))
                  ? `${formatNumber(info.vplsBackingRatio)} to 1`
                  : `${formatNumber(Number(info.vplsBackingRatio).toFixed(4))} to 1`}
              </p>
              <p className="text-gray-600">
                <strong>vPLS Added by Strategy:</strong> {formatNumber(info.vplsAddedByStrategy)} vPLS
              </p>
            </>
          )}
          {chainId === 369 && (
            <>
              <p className="text-gray-600">
                <strong>xBOND Burned:</strong> {formatNumber(info.totalBurned)} xBOND
              </p>
              <p className="text-gray-600">
                <strong>PLSX Backing Ratio:</strong>{" "}
                {Number.isInteger(Number(info.plsxBackingRatio))
                  ? `${formatNumber(info.plsxBackingRatio)} to 1`
                  : `${formatNumber(Number(info.plsxBackingRatio).toFixed(4))} to 1`}
              </p>
              <p className="text-gray-600">
                <strong>PLSX Added by Strategy:</strong> {formatNumber(info.plsxAddedByStrategy)} PLSX
              </p>
            </>
          )}
          <p className="text-gray-600">
            <strong>Issuance Period:</strong> {countdown}
          </p>
        </>
      )}
    </div>
  );
};

export default ContractInfo;
