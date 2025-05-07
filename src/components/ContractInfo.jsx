import { useState, useEffect } from "react";

const ContractInfo = ({ contract, web3 }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "0", totalIssued: "0" });
  const [backingRatio, setBackingRatio] = useState("0");
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatNumber = (num) => {
    return parseFloat(num.toFixed(4)).toString(); // Max 4 decimals, remove trailing zeros
  };

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await contract.methods.getContractInfo().call();
      if (!result || !result.contractBalance || !result.remainingIssuancePeriod) {
        throw new Error("Invalid contract info response");
      }
      const ratio = await contract.methods.getVPLSBackingRatio().call();
      const totalIssued = await contract.methods.totalSupply().call();
      const ratioDecimal = web3.utils.fromWei(ratio, "ether");
      setInfo({
        balance: web3.utils.fromWei(result.contractBalance, "ether"),
        issuancePeriod: result.remainingIssuancePeriod,
        totalIssued: web3.utils.fromWei(totalIssued, "ether"),
      });
      setBackingRatio(formatNumber(ratioDecimal));
      console.log("Contract info fetched:", {
        balance: result.contractBalance,
        period: result.remainingIssuancePeriod,
        totalIssued,
        ratioRaw: ratio,
        ratioDecimal,
      });
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      setError(`Failed to load contract data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && web3) fetchInfo();
  }, [contract, web3]);

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
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 2000)}
            className="mt-2 text-purple-300 hover:text-purple-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p><strong>Contract Balance:</strong> {info.balance} vPLS</p>
          <p><strong>Total PLSTR Issued:</strong> {info.totalIssued} PLSTR</p>
          <p><strong>Issuance Period Countdown:</strong> {countdown}</p>
          <p><strong>VPLS Backing Ratio:</strong> {backingRatio}</p>
        </>
      )}
    </div>
  );
};

export default ContractInfo;
