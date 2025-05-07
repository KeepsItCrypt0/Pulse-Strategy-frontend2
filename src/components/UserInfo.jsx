import { useState, useEffect } from "react";
import { ethers } from "ethers";

const UserInfo = ({ contract, account }) => {
  const [shareBalance, setShareBalance] = useState("0");
  const [redeemablePLS, setRedeemablePLS] = useState("0");

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const balance = await contract.methods.balanceOf(account).call();
        const redeemable = await contract.methods.getRedeemableStakedPLS(account, balance).call();
        setShareBalance(ethers.utils.formatEther(balance));
        setRedeemablePLS(ethers.utils.formatEther(redeemable));
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    if (contract && account) fetchInfo();
  }, [contract, account]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Information</h2>
      <p><strong>PLSTR Balance:</strong> {shareBalance} PLSTR</p>
      <p><strong>Redeemable stakedPLS:</strong> {redeemablePLS} stakedPLS</p>
    </div>
  );
};

export default UserInfo;
