import { useState, useEffect } from "react";
import { ethers } from "ethers";

const ContractInfo = ({ contract }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "0" });
  const [backingRatio, setBackingRatio] = useState("0");
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      const { contractBalance, remainingIssuancePeriod } = await contract.methods.getContractInfo().call();
      const ratio = await contract.methods.getVPLSBackingRatio().call();
      setInfo({
        balance: ethers.utils.formatEther(contractBalance),
        issuancePeriod: remainingIssuancePeriod,
      });
      setBackingRatio(ethers.utils.formatEther(ratio));
    } catch (error) {
      console.error("Failed to fetch contract info:", error);
      setError(`Failed to load contract data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) fetchInfo();
  }, [contract]);

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
            onClick={() => setTimeout(fetchInfo, 2000)} // Delay to avoid rate limits
            className="mt-2 text-purple-300 hover:text-pink-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p><strong>Contract Balance:</strong> {info.balance} vPLS</p>
          <p><strong>Issuance Period Countdown:</strong> {countdown}</p>
          <p><strong>VPLS Backing Ratio:</strong> {backingRatio}</p>
        </>
      )}
    </div>
  );
};

export default ContractInfo;
