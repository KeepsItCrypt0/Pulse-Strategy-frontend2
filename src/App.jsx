import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import AdminPanel from "./components/AdminPanel";
import UserInfo from "./components/UserInfo";
import { getWeb3, getContract } from "./web3";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isController, setIsController] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        const contractInstance = await getContract(web3Instance);
        setContract(contractInstance);
        const owner = await contractInstance.methods.owner().call();
        setIsController(accounts[0]?.toLowerCase() === owner.toLowerCase());
      } catch (error) {
        console.error("Web3 initialization failed:", error);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-center text-blue-600">PulseStrategy</h1>
        <p className="text-center text-gray-600 mt-2">Interact with the PLSTR smart contract on Ethereum Mainnet</p>
        <ConnectWallet account={account} />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {account && contract ? (
          <>
            <ContractInfo contract={contract} />
            <UserInfo contract={contract} account={account} />
            <IssueShares web3={web3} contract={contract} account={account} />
            <RedeemShares contract={contract} account={account} />
            {isController && <AdminPanel web3={web3} contract={contract} account={account} />}
          </>
        ) : (
          <p className="text-center text-gray-600">Please connect your wallet to interact with the contract.</p>
        )}
      </main>
      <footer className="mt-12 text-center text-gray-500">
        <p>Built for PulseStrategy | Deployed on Ethereum Mainnet</p>
      </footer>
    </div>
  );
}

export default App;
