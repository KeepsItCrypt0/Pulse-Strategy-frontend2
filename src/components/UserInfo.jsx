import { useState, useEffect } from "react";
import { formatNumber } from "../utils/format";
import { contractAddresses, tokenAddresses, vPLS_ABI, plsxABI, incABI, xBond_ABI, iBond_ABI, PLStr_ABI } from "../web3";

const UserInfo = ({ contract, account, web3, chainId, contractSymbol }) => {
  const [userData, setUserData] = useState({
    balance: "0",
    redeemableValue: "0",
    claimablePLStr: "0",
    xBondBalance: "0",
    iBondBalance: "0",
    xBondPlsxLPBalance: "0",
    iBondIncLPBalance: "0",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fromUnits = (balance) => {
    try {
      if (!balance || balance === "0") return "0";
      return web3.utils.fromWei(balance.toString(), "ether");
    } catch (err) {
      console.error("Error converting balance:", { balance, error: err.message });
      return "0";
    }
  };

  const fetchUserData = async () => {
    if (!web3 || !contract || !account || chainId !== 369) {
      console.warn("fetchUserData: Invalid inputs", { web3: !!web3, contract: !!contract, account, chainId });
      return;
    }
    try {
      setLoading(true);
      setError("");

      const balance = await contract.methods.balanceOf(account).call();
      let data = {
        balance: fromUnits(balance),
        redeemableValue: "0",
        claimablePLStr: "0",
        xBondBalance: "0",
        iBondBalance: "0",
        xBondPlsxLPBalance: "0",
        iBondIncLPBalance: "0",
      };

      const tokenAddrs = tokenAddresses[369];

      let backingTokenBalance, totalSupply, redeemableTokenSymbol;
      if (contractSymbol === "PLStr") {
        const metrics = await contract.methods.getBasicMetrics().call();
        console.log("getBasicMetrics result for PLStr:", { metrics });
        const { contractTotalSupply, vPlsBalance, totalClaimablePLStr } = Array.isArray(metrics)
          ? { contractTotalSupply: metrics[0], vPlsBalance: metrics[1], totalClaimablePLStr: metrics[5] }
          : metrics;
        totalSupply = BigInt(contractTotalSupply) + BigInt(totalClaimablePLStr); // Include unclaimed PLStr
        backingTokenBalance = vPlsBalance;
        redeemableTokenSymbol = "vPLS";
      } else if (contractSymbol === "xBond" && tokenAddrs.PLSX) {
        try {
          const metrics = await contract.methods.getContractMetrics().call();
          console.log("getContractMetrics result for xBond:", { metrics });
          const { contractTotalSupply, plsxBalance } = Array.isArray(metrics)
            ? { contractTotalSupply: metrics[0], plsxBalance: metrics[1] }
            : metrics;
          totalSupply = contractTotalSupply;
          backingTokenBalance = plsxBalance;
        } catch (err) {
          console.warn("getContractMetrics failed for xBond, using balanceOf:", err.message);
          const plsxContract = new web3.eth.Contract(plsxABI, tokenAddrs.PLSX);
          backingTokenBalance = await plsxContract.methods.balanceOf(contractAddresses[369].xBond).call();
          totalSupply = await contract.methods.totalSupply().call();
        }
        redeemableTokenSymbol = "PLSX";
      } else if (contractSymbol === "iBond" && tokenAddrs.INC) {
        try {
          const metrics = await contract.methods.getContractMetrics().call();
          console.log("getContractMetrics result for iBond:", { metrics });
          const { contractTotalSupply, incBalance } = Array.isArray(metrics)
            ? { contractTotalSupply: metrics[0], incBalance: metrics[1] }
            : metrics;
          totalSupply = contractTotalSupply;
          backingTokenBalance = incBalance;
        } catch (err) {
          console.warn("getContractMetrics failed for iBond, using balanceOf:", err.message);
          const incContract = new web3.eth.Contract(incABI, tokenAddrs.INC);
          backingTokenBalance = await incContract.methods.balanceOf(contractAddresses[369].iBond).call();
          totalSupply = await contract.methods.totalSupply().call();
        }
        redeemableTokenSymbol = "INC";
      }

      if (Number(totalSupply) > 0) {
        const redeemable = (BigInt(balance) * BigInt(backingTokenBalance)) / BigInt(totalSupply);
        data.redeemableValue = fromUnits(redeemable.toString());
      }

      if (contractSymbol === "PLStr") {
        let claimablePLStr, xBondBalance, iBondBalance, xBondPlsxLPBalance, iBondIncLPBalance;
        try {
          const result = await contract.methods.getClaimEligibility(account).call();
          console.log("getClaimEligibility raw result:", { result, type: typeof result, account, contractAddress: contract.options.address });

          if (Array.isArray(result) && result.length >= 5) {
            [claimablePLStr, xBondBalance, iBondBalance, xBondPlsxLPBalance, iBondIncLPBalance] = result;
            console.log("getClaimEligibility parsed as array:", {
              claimablePLStr,
              xBondBalance,
              iBondBalance,
              xBondPlsxLPBalance,
              iBondIncLPBalance,
            });
          } else if (typeof result === "object" && result !== null) {
            claimablePLStr = result.claimablePLStr || result[0] || "0";
            xBondBalance = result.xBondBalance || result[1] || "0";
            iBondBalance = result.iBondBalance || result[2] || "0";
            xBondPlsxLPBalance = result.xBondPlsxLPBalance || result[3] || "0";
            iBondIncLPBalance = result.iBondIncLPBalance || result[4] || "0";
            console.log("getClaimEligibility parsed as object:", {
              claimablePLStr,
              xBondBalance,
              iBondBalance,
              xBondPlsxLPBalance,
              iBondIncLPBalance,
            });
          } else {
            throw new Error("Unexpected getClaimEligibility result format");
          }

          if (
            isNaN(Number(claimablePLStr)) ||
            isNaN(Number(xBondBalance)) ||
            isNaN(Number(iBondBalance)) ||
            isNaN(Number(xBondPlsxLPBalance)) ||
            isNaN(Number(iBondIncLPBalance))
          ) {
            throw new Error(
              `Invalid number format: ${JSON.stringify({
                claimablePLStr,
                xBondBalance,
                iBondBalance,
                xBondPlsxLPBalance,
                iBondIncLPBalance,
              })}`
            );
          }

          data.claimablePLStr = fromUnits(claimablePLStr);
          data.xBondBalance = fromUnits(xBondBalance);
          data.iBondBalance = fromUnits(iBondBalance);
          data.xBondPlsxLPBalance = fromUnits(xBondPlsxLPBalance);
          data.iBondIncLPBalance = fromUnits(iBondIncLPBalance);
        } catch (err) {
          console.error("getClaimEligibility failed:", err.message);
          throw err;
        }
      }

      setUserData({ ...data, redeemableTokenSymbol });
    } catch (err) {
      setError(`Failed to load user data: ${err.message}`);
      console.error("Fetch user data error:", {
        error: err.message,
        account,
        contractAddress: contract.options.address,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (web3 && contract && account && chainId === 369) fetchUserData();
  }, [web3, contract, account, chainId, contractSymbol]);

  if (chainId !== 369) {
    return (
      <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
        <p className="text-[#8B0000]">Please connect to PulseChain (chain ID 369)</p>
      </div>
    );
  }

  return (
    <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
      <h2 className="text-xl font-semibold mb-4 text-[#4B0082]">{contractSymbol} User Info</h2>
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-[#8B0000]">{error}</p>
      ) : (
        <>
          <p className="text-gray-500">
            Balance: <span className="text-[#4B0082]">{formatNumber(userData.balance)} {contractSymbol}</span>
          </p>
          <p className="text-gray-500">
            Redeemable Value: <span className="text-[#4B0082]">{formatNumber(userData.redeemableValue)} {userData.redeemableTokenSymbol}</span>
          </p>
          {contractSymbol === "PLStr" && (
            <>
              <p className="text-gray-500">
                Claimable PLStr: <span className="text-[#4B0082]">{formatNumber(userData.claimablePLStr)} PLStr</span>
              </p>
              <p className="text-gray-500">
                xBond Balance: <span className="text-[#4B0082]">{formatNumber(userData.xBondBalance)} xBond</span>
              </p>
              <p className="text-gray-500">
                iBond Balance: <span className="text-[#4B0082]">{formatNumber(userData.iBondBalance)} iBond</span>
              </p>
              <p className="text-gray-500">
                xBond/PLSX LP Balance: <span className="text-[#4B0082]">{formatNumber(userData.xBondPlsxLPBalance)} PLP</span>
              </p>
              <p className="text-gray-500">
                iBond/INC LP Balance: <span className="text-[#4B0082]">{formatNumber(userData.iBondIncLPBalance)} PLP</span>
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UserInfo;
