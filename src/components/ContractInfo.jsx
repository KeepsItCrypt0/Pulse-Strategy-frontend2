import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, PLStr_ABI, xBond_ABI, iBond_ABI } from "../web3";

const ContractInfo = ({ contract, web3, chainId, contractSymbol }) => {
  const [contractData, setContractData] = useState({
    totalSupply: "0",
    metrics: {
      vPlsBalance: "0",
      plsxBalance: "0",
      incBalance: "0",
      totalMinted: "0",
      totalBurned: "0",
      vPlsBackingRatio: "0",
      plsxBackingRatio: "0",
      incBackingRatio: "0",
      totalClaimablePLStr: "0",
    },
    issuanceStatus: { isActive: false, timeRemaining: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fromUnits = (balance) => {
    try {
      if (!balance || balance === "0") return "0";
      return web3.utils.fromWei(balance.toString(), "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, error: err.message });
      return "0";
    }
  };

  const formatTimeRemaining = (seconds) => {
    if (seconds <= 0) return "0";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days} day${days !== 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""}`;
  };

  const fetchContractData = async () => {
    if (!contract || !web3 || chainId !== 369) return;
    try {
      setLoading(true);
      setError(null);

      const isPLStr = contractSymbol === "PLStr";
      const promises = [
        contract.methods.totalSupply().call(),
        contract.methods[isPLStr ? "getBasicMetrics" : "getContractMetrics"]().call(),
      ];

      if (isPLStr) {
        promises.push(contract.methods.getDaysUntilExpiration().call());
      } else {
        promises.push(contract.methods.getIssuanceStatus().call());
      }

      const [totalSupply, metrics, extraData] = await Promise.all(promises);

      const data = {
        totalSupply: fromUnits(totalSupply),
        metrics: isPLStr
          ? {
              vPlsBalance: fromUnits(metrics[1]),
              plsxBalance: "0",
              incBalance: "0",
              totalMinted: fromUnits(metrics[2]),
              totalBurned: fromUnits(metrics[3]),
              vPlsBackingRatio: Number(extraData) === 0 ? "1.0000" : Number(fromUnits(metrics[4])).toFixed(4), // 1:1 if expired
              totalClaimablePLStr: fromUnits(metrics[5]),
            }
          : {
              vPlsBalance: "0",
              plsxBalance: contractSymbol === "xBond" ? fromUnits(metrics[1]) : "0",
              incBalance: contractSymbol === "iBond" ? fromUnits(metrics[1]) : "0",
              totalMinted: fromUnits(metrics[2]),
              totalBurned: fromUnits(metrics[3]),
              plsxBackingRatio: contractSymbol === "xBond" ? fromUnits(metrics[4]) : "0",
              incBackingRatio: contractSymbol === "iBond" ? fromUnits(metrics[4]) : "0",
              vPlsBackingRatio: "0",
              totalClaimablePLStr: "0",
            },
        issuanceStatus: isPLStr
          ? { isActive: false, timeRemaining: 0 }
          : { isActive: extraData[0], timeRemaining: Number(extraData[1]) },
      };

      setContractData(data);
    } catch (err) {
      console.error("Error fetching contract data:", {
        error: err.message,
        contractSymbol,
      });
      setError(`Failed to load ${contractSymbol} data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3 && chainId === 369) {
      fetchContractData();
    }
  }, [contract, web3, chainId, contractSymbol]);

  if (chainId !== 369) {
    return (
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
        <p className="text-[#8B0000]">Please connect to PulseChain (chain ID 369)</p>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">{contractSymbol} Contract Info</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-[#8B0000]">{error}</p>
      ) : (
        <>
          <h3 className="text-lg font-medium mt-4">Contract Details</h3>
          {contractSymbol === "PLStr" && (
            <>
              <p className="text-gray-600">
                vPLS Balance: <span className="text-[#4B0082]">{formatNumber(contractData.metrics.vPlsBalance)} vPLS</span>
              </p>
              <p className="text-gray-600">
                Total Claimable PLStr: <span className="text-[#4B0082]">{formatNumber(contractData.metrics.totalClaimablePLStr)} PLStr</span>
              </p>
            </>
          )}
          {contractSymbol !== "PLStr" && (
            <p className="text-gray-600">
              {contractSymbol === "xBond" ? "PLSX" : "INC"} Balance:{" "}
              <span className="text-[#4B0082]">
                {formatNumber(contractSymbol === "xBond" ? contractData.metrics.plsxBalance : contractData.metrics.incBalance)}{" "}
                {contractSymbol === "xBond" ? "PLSX" : "INC"}
              </span>
            </p>
          )}
          <p className="text-gray-600">
            Total Supply: <span className="text-[#4B0082]">{formatNumber(contractData.totalSupply)} {contractSymbol}</span>
          </p>
          <p className="text-gray-600">
            Total Minted: <span className="text-[#4B0082]">{formatNumber(contractData.metrics.totalMinted)} {contractSymbol}</span>
          </p>
          <p className="text-gray-600">
            Total Burned: <span className="text-[#4B0082]">{formatNumber(contractData.metrics.totalBurned)} {contractSymbol}</span>
          </p>
          {contractSymbol === "PLStr" && (
            <p className="text-gray-600">
              vPLS Backing Ratio: <span className="text-[#4B0082]">{formatNumber(contractData.metrics.vPlsBackingRatio)}</span>
            </p>
          )}
          {contractSymbol !== "PLStr" && (
            <>
              <p className="text-gray-600">
                Backing Ratio:{" "}
                <span className="text-[#4B0082]">
                  {formatNumber(contractSymbol === "xBond" ? contractData.metrics.plsxBackingRatio : contractData.metrics.incBackingRatio)}
                </span>
              </p>
              <p className="text-gray-600">
                Issuance Status:{" "}
                <span className="text-[#4B0082]">
                  {contractData.issuanceStatus.isActive ? "Active" : "Ended"}
                </span>
              </p>
              <p className="text-gray-600">
                Time Remaining:{" "}
                <span className="text-[#4B0082]">
                  {contractData.issuanceStatus.isActive
                    ? formatTimeRemaining(contractData.issuanceStatus.timeRemaining)
                    : "0"}
                </span>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ContractInfo;
