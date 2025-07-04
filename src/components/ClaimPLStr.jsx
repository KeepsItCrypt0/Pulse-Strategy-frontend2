import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, PLStr_ABI } from "../web3";

const ClaimPLStr = ({ contract, account, web3, chainId, contractSymbol, onTransactionSuccess }) => {
  const [pendingPLStr, setPendingPLStr] = useState("0");
  const [xBondBalance, setXBondBalance] = useState("0");
  const [iBondBalance, setIBondBalance] = useState("0");
  const [xBondPlsxLPBalance, setXBondPlsxLPBalance] = useState("0");
  const [iBondIncLPBalance, setIBondIncLPBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPendingPLStr = async () => {
    if (!web3 || !contract || !account || chainId !== 369) {
      console.warn("fetchPendingPLStr: Invalid inputs", { web3: !!web3, contract: !!contract, account, chainId });
      return;
    }
    try {
      const result = await contract.methods.getClaimEligibility(account).call();
      console.log("getClaimEligibility raw result:", { result, type: typeof result, account, contractAddress: contract.options.address });

      let claimablePLStr, xBondBal, iBondBal, xBondPlsxLPBal, iBondIncLPBal;
      if (Array.isArray(result) && result.length >= 5) {
        [claimablePLStr, xBondBal, iBondBal, xBondPlsxLPBal, iBondIncLPBal] = result;
        console.log("getClaimEligibility parsed as array:", {
          claimablePLStr,
          xBondBal,
          iBondBal,
          xBondPlsxLPBal,
          iBondIncLPBal,
        });
      } else if (typeof result === "object" && result !== null) {
        claimablePLStr = result.claimablePLStr || result[0] || "0";
        xBondBal = result.xBondBalance || result[1] || "0";
        iBondBal = result.iBondBalance || result[2] || "0";
        xBondPlsxLPBal = result.xBondPlsxLPBalance || result[3] || "0";
        iBondIncLPBal = result.iBondIncLPBalance || result[4] || "0";
        console.log("getClaimEligibility parsed as object:", {
          claimablePLStr,
          xBondBal,
          iBondBal,
          xBondPlsxLPBal,
          iBondIncLPBal,
        });
      } else {
        throw new Error("Unexpected getClaimEligibility result format");
      }

      if (
        isNaN(Number(claimablePLStr)) ||
        isNaN(Number(xBondBal)) ||
        isNaN(Number(iBondBal)) ||
        isNaN(Number(xBondPlsxLPBal)) ||
        isNaN(Number(iBondIncLPBal))
      ) {
        throw new Error(
          `Invalid number format: ${JSON.stringify({
            claimablePLStr,
            xBondBal,
            iBondBal,
            xBondPlsxLPBal,
            iBondIncLPBal,
          })}`
        );
      }

      setPendingPLStr(web3.utils.fromWei(claimablePLStr.toString(), "ether"));
      setXBondBalance(web3.utils.fromWei(xBondBal.toString(), "ether"));
      setIBondBalance(web3.utils.fromWei(iBondBal.toString(), "ether"));
      setXBondPlsxLPBalance(web3.utils.fromWei(xBondPlsxLPBal.toString(), "ether"));
      setIBondIncLPBalance(web3.utils.fromWei(iBondIncLPBal.toString(), "ether"));
    } catch (err) {
      console.error("Error fetching claimable PLStr:", {
        error: err.message,
        account,
        contractAddress: contract.options.address,
      });
      setError(`Failed to load claimable PLStr: ${err.message}`);
      setPendingPLStr("0");
      setXBondBalance("0");
      setIBondBalance("0");
      setXBondPlsxLPBalance("0");
      setIBondIncLPBalance("0");
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) fetchPendingPLStr();
  }, [web3, contract, account, chainId]);

  const handleClaim = async () => {
    if (Number(pendingPLStr) <= 0) {
      setError("No PLStr available to claim");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await contract.methods.claimPLStr().send({ from: account });
      alert(`Successfully claimed ${pendingPLStr} PLStr!`);
      setPendingPLStr("0");
      await fetchPendingPLStr();
      if (onTransactionSuccess) {
        onTransactionSuccess();
      }
      console.log("PLStr claimed:", { account, contractAddress: contract.options.address });
    } catch (err) {
      console.error("Error claiming PLStr:", {
        error: err.message,
        account,
        contractAddress: contract.options.address,
      });
      setError(`Error claiming PLStr: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (chainId !== 369 || contractSymbol !== "PLStr") return null;

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">Claim PLStr</h2>
      <p className="text-gray-500 mb-2">
        Pending PLStr: <span className="text-[#4B0082]">{formatNumber(pendingPLStr)} PLStr</span>
      </p>
      <p className="text-gray-500 mb-2">
        xBond Balance: <span className="text-[#4B0082]">{formatNumber(xBondBalance)} xBond</span>
      </p>
      <p className="text-gray-500 mb-2">
        iBond Balance: <span className="text-[#4B0082]">{formatNumber(iBondBalance)} iBond</span>
      </p>
      <p className="text-gray-500 mb-2">
        xBond/PLSX LP Balance: <span className="text-[#4B0082]">{formatNumber(xBondPlsxLPBalance)} PLP</span>
      </p>
      <p className="text-gray-500 mb-2">
        iBond/INC LP Balance: <span className="text-[#4B0082]">{formatNumber(iBondIncLPBalance)} PLP</span>
      </p>
      <button
        onClick={handleClaim}
        disabled={loading || Number(pendingPLStr) <= 0}
        className="btn-primary"
      >
        {loading ? "Processing..." : "Claim PLStr"}
      </button>
      {error && <p className="text-[#8B0000] mt-2">{error}</p>}
    </div>
  );
};

export default ClaimPLStr;
