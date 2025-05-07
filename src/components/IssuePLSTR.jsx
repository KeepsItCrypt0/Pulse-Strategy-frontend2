import { useState, useEffect } from "react";
import { getVPLSContract } from "../web3";

const IssuePLSTR = ({ web3, contract, account }) => {
  const [amount, setAmount] = useState("");
  const [vPLSBalance, setVPLSBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchBalance = async () => {
    try {
      setError("");
      const vPLSContract = await getVPLSContract(web3);
      const balance = await vPLSContract.methods.balanceOf(account).call();
      if (balance === undefined || balance === null) {
        throw new Error("Invalid vPLS balance response");
      }
      setVPLSBalance(web3.utils.fromWei(balance, "ether"));
      console.log("vPLS balance fetched:", { balance });
    } catch (err) {
      console.error("Failed to fetch vPLS balance:", err);
      setError(`Failed to load vPLS balance: ${err.message || "Unknown error"}`);
    }
  };

  useEffect(() => {
    if (web3 && account) fetchBalance();
  }, [web3, account]);

  const handleIssue = async () => {
    setLoading(true);
    setError("");
    try {
      const vPLSContract = await getVPLSContract(web3);
      const amountWei = web3.utils.toWei(amount, "ether");
      await vPLSContract.methods
        .approve(contract._address, amountWei)
        .send({ from: account });
      await contract.methods.issueShares(amountWei).send({ from: account });
      alert("PLSTR issued successfully!");
      setAmount("");
      fetchBalance();
      console.log("PLSTR issued:", { amountWei });
    } catch (err) {
      setError(`Error issuing PLSTR: ${err.message || "Unknown error"}`);
      console.error("Issue PLSTR error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-purple-600">Issue PLSTR</h2>
      <p className="text-gray-600 mb-2">Your vPLS Balance: {vPLSBalance} vPLS</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount of vPLS"
        className="w-full p-2 border rounded-lg mb-4"
      />
      <button
        onClick={handleIssue}
        disabled={loading || !amount}
        className={loading || !amount ? "btn-disabled" : "btn-primary"}
      >
        {loading ? "Processing..." : "Issue PLSTR"}
      </button>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  );
};

export default IssuePLSTR;
