import { useState, useEffect } from "react";
import { getWeb3, getContract, getAccount } from "./web3";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import IssuePLSTR from "./components/IssuePLSTR";
import RedeemPLSTR from "./components/RedeemPLSTR";
import AdminPanel from "./components/AdminPanel";
import UserInfo from "./components/UserInfo";
import "./index.css";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  const initializeWeb3 = async () => {
    try {
      const web3Instance = await getWeb3();
      if (web3Instance) {
        setWeb3(web3Instance);
        const contractInstance = await getContract(web3Instance);
        setContract(contractInstance);
        const accountInstance = await getAccount(web3Instance);
        setAccount(accountInstance);
        if (accountInstance) {
          const owner = await contractInstance.methods.owner().call();
          setIsOwner(accountInstance.toLowerCase() === owner.toLowerCase());
          console.log("Initialized:", { account: accountInstance, isOwner: accountInstance.toLowerCase() === owner.toLowerCase() });
        }
      }
    } catch (error) {
      console.error("Failed to initialize web3:", error);
    }
  };

  useEffect(() => {
    initializeWeb3();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Pulse Strategy</h1>
        <ConnectWallet account={account} web3={web3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <ContractInfo contract={contract} web3={web3} />
          <IssuePLSTR web3={web3} contract={contract} account={account} />
          <RedeemPLSTR web3={web3} contract={contract} account={account} />
          <UserInfo web3={web3} contract={contract} account={account} />
          {isOwner && <AdminPanel web3={web3} contract={contract} account={account} />}
        </div>
        <footer className="mt-8 text-center text-gray-400">
          <p>Disclaimer: Use at your own risk. Ensure you understand the contract mechanics.</p>
          <p>
            <a href="https://github.com/KeepsItCrypt0/Pulse-Strategy-frontend2" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-red-300">
              GitHub
            </a>
            {" | "}
            <a href="https://x.com/YourXHandle" target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-red-300">
              X
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
