import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const UserInfo = ({ contract, account, web3 }) => {
  const [plstrBalance, setPlstrBalance] = useState("0");
  const [redeemableVPLS, setRedeemableVPLS] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    try {
      setLoading(true);
      setError("");
      const balance = await contract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error("Invalid balance response");
      }
      const redeemable = await contract.methods.getRedeemableStakedPLS(account, balance).call();
      if (redeemable === undefined || redeemable === null) {
        throw new Error("Invalid redeemable vPLS response");
      }
      setPlstrBalance(web3.utils.fromWei(balance, "ether"));
      setRedeemableVPLS(web3.utils.fromWei(redeemable, "ether"));
      console.log("User info fetched:", { plstrBalance: balance, redeemableVPLS: redeemable });
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setError(`Failed to load user data: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account && web3) fetchInfo();
  }, [contract, account, web3]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Your Information</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => setTimeout(fetchInfo, 2000)}
            className="mt-2 text-purple-300 hover:text-pink-400"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <p>
            <strong>PLSTR Balance:</strong> {formatNumber(plstrBalance)} PLSTR
          </p>
          <p>
            <strong>Redeemable vPLS:</strong> {formatNumber(redeemableVPLS)} vPLS
          </p>
        </>
      )}
    </div>
  );
};

export default UserInfo;
