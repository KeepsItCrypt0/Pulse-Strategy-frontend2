import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const WeightUpdate = ({ contract, account, web3, chainId, onTransactionSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weightData, setWeightData] = useState({
    currentWeight: "0",
    lastUpdate: 0,
    timeUntilNextUpdate: 0,
  });

  const WEIGHT_COOLDOWN = 86400; // 24 hours in seconds

  const fromUnits = (value) => {
    try {
      if (!value || value === "0") return "0";
      return web3.utils.fromWei(value.toString(), "ether");
    } catch (err) {
      console.error("Error converting value:", { value, error: err.message });
      return "0";
    }
  };

  // Format time remaining (seconds) to hours/minutes
  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return "Ready for update";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  };

  const fetchWeightData = async () => {
    if (!contract || !web3 || chainId !== 369) {
      setError("Invalid contract or network");
      return;
    }
    try {
      const [currentWeight, lastUpdate] = await Promise.all([
        contract.methods.getCurrentWeight().call(),
        contract.methods.getLastWeightUpdate().call(),
      ]);

      const lastUpdateTimestamp = Number(lastUpdate);
      if (isNaN(lastUpdateTimestamp) || lastUpdateTimestamp < 0) {
        throw new Error("Invalid last weight update timestamp");
      }

      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      const timeSinceLastUpdate = currentTime - lastUpdateTimestamp;
      const timeUntilNextUpdate = Math.max(0, WEIGHT_COOLDOWN - timeSinceLastUpdate);

      setWeightData({
        currentWeight: fromUnits(currentWeight),
        lastUpdate: lastUpdateTimestamp,
        timeUntilNextUpdate,
      });

      console.log("Weight data fetched:", {
        currentWeight: fromUnits(currentWeight),
        lastUpdate: lastUpdateTimestamp,
        timeUntilNextUpdate,
      });
    } catch (err) {
      console.error("Error fetching weight data:", {
        error: err.message,
      });
      setError(`Failed to load weight data: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchWeightData();
    // Update countdown every minute
    const interval = setInterval(() => {
      setWeightData((prev) => {
        const newTimeUntilNextUpdate = Math.max(0, prev.timeUntilNextUpdate - 60);
        console.log("Interval update:", { newTimeUntilNextUpdate });
        return { ...prev, timeUntilNextUpdate: newTimeUntilNextUpdate };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [contract, web3, chainId]);

  const handleUpdateWeight = async () => {
    if (!window.confirm("Are you sure you want to update the Bond weight? This can only be done every 24 hours.")) return;
    setLoading(true);
    setError("");
    try {
      await contract.methods.updateWeight().send({ from: account });
      alert("Bond weight updated successfully!");
      await fetchWeightData();
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
    } catch (err) {
      const errorMessage = err.message.includes("WeightUpdateTooSoon")
        ? "Weight update too soon; please wait 24 hours since the last update"
        : `Error updating weight: ${err.message}`;
      setError(errorMessage);
      console.error("Update weight error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369) {
    console.log("WeightUpdate: Invalid chainId", { chainId });
    return <div className="text-gray-600 p-6">Please connect to PulseChain</div>;
  }

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">Update Bond Weight</h2>
      <p className="text-gray-600">
        Current Weight: <span className="text-[#4B0082]">{formatNumber(weightData.currentWeight)}</span>
      </p>
      <p className="text-gray-600">
        Last Update:{" "}
        <span className="text-[#4B0082]">
          {weightData.lastUpdate ? new Date(weightData.lastUpdate * 1000).toLocaleString() : "Never"}
        </span>
      </p>
      <p className="text-gray-600">
        Next Update Available In:{" "}
        <span className="text-[#4B0082]">
          {weightData.timeUntilNextUpdate !== undefined
            ? formatTimeRemaining(weightData.timeUntilNextUpdate)
            : "Loading..."}
        </span>
      </p>
      <button
        onClick={handleUpdateWeight}
        disabled={loading || weightData.timeUntilNextUpdate > 0}
        className="btn-primary mt-4"
      >
        {loading ? "Processing..." : "Update Weight"}
      </button>
      {error && <p className="text-[#8B0000] mt-2">{error}</p>}
    </div>
  );
};

export default WeightUpdate;
