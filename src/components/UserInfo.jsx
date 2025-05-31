import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";

const UserInfo = ({ contract, account, web3, chainId }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [redeemableToken, setRedeemableToken] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInfo = async () => {
    if (!contract || !account || !web3 || !chainId) {
      setError("Contract, account, or Web3 not initialized");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const balance = await contract.methods.balanceOf(account).call();
      const balanceEther = web3.utils.fromWei(balance, "ether");

      let redeemable;
      if (chainId === 1) {
        const normalizedAccount = web3.utils.toChecksumAddress(account);
        redeemable = await contract.methods
          .getRedeemableStakedPLS(normalizedAccount, balance)
          .call({ from: normalizedAccount });
      } else {
        redeemable = await contract.methods
          .getRedeemablePLSX(account, balance)
          .call({ from: account });
      }
      const redeemableEther = web3.utils.fromWei(redeemable || "0", "ether");

      setShareBalance(balanceEther);
      setRedeemableToken(redeemableEther);
      console.log("User info fetched:", {
        shareBalance: balanceEther,
        redeemableToken: redeemableEther,
        chainId,
        account,
      });
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      setError(`Failed to load user data: ${error.message || "Contract execution failed"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account && web3 && chainId) fetchInfo();
  }, [contract, account, web3, chainId]);

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Your Information</h2>
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
          <p>
            <strong>{chainId === 1 ? "PLSTR" : "xBOND"} Balance:</strong>{" "}
            {formatNumber(shareBalance)} {chainId === 1 ? "PLSTR" : "xBOND"}
          </p>
          <p>
            <strong>Redeemable {chainId === 1 ? "vPLS" : "PLSX"}:</strong>{" "}
            {formatNumber(redeemableToken)} {chainId === 1 ? "vPLS" : "PLSX"}
          </p>
        </>
      )}
    </div>
  );
};

export default UserInfo;
