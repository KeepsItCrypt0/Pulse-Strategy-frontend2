import { useState, useEffect } from "react";
import { ethers } from "ethers";

const ContractInfo = ({ contract }) => {
  const [info, setInfo] = useState({ balance: "0", issuancePeriod: "0" });
  const [backingRatio, setBackingRatio] = useState("0");

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const { contractBalance, remainingIssuancePeriod } = await contract.methods.getContractInfo().call();
        const ratio = await contract.methods.getVPLSBackingRatio().call();
        setInfo({
          balance: ethers.utils.formatEther(contractBalance),
          issuancePeriod: remainingIssuancePeriod,
        });
        setBackingRatio(ethers.utils.formatEther(ratio));
      } catch (error) {
        console.error("Failed to fetch contract info:", error);
      }
    };
    if (contract) fetchInfo();
  }, [contract]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
      <p><strong>Contract Balance:</strong> {info.balance} stakedPLS</p>
      <p><strong>Remaining Issuance Period:</strong> {Number(info.issuancePeriod) / 86400} days</p>
      <p><strong>VPLS Backing Ratio:</strong> {backingRatio}</p>
    </div>
  );
};

export default ContractInfo;
