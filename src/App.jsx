import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import IssuePLSTR from "./components/IssuePLSTR";
import RedeemPLSTR from "./components/RedeemPLSTR";
import AdminPanel from "./components/AdminPanel";
import UserInfo from "./components/UserInfo";
import { getWeb3, getContract, contractAddress } from "./web3";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isController, setIsController] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ network: "Unknown", contract: "Unknown" });

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
        const chainId = await web3Instance.eth.getChainId();
        setDebugInfo({
          network: chainId === 1 ? "Ethereum Mainnet" : `Chain ID: ${chainId}`,
          contract: contractAddress,
        });
        console.log("App initialized:", { account: accounts[0], chainId, owner });
      } catch (error) {
        console.error("Web3 initialization failed:", error);
        setDebugInfo((prev) => ({ ...prev, contract: `Failed: ${error.message}` }));
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <h1 className="text-3xl font-bold text-center text-purple-600">PulseStrategy</h1>
        <p className="text-center text-gray-600 mt-2">Interact with the PLSTR contract on Ethereum Mainnet</p>
        <ConnectWallet account={account} web3={web3} />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {account && contract ? (
          <>
            <ContractInfo contract={contract} web3={web3} />
            <UserInfo contract={contract} account={account} web3={web3} />
            <IssuePLSTR web3={web3} contract={contract} account={account} />
            <RedeemPLSTR contract={contract} account={account} web3={web3} />
            {isController && <AdminPanel web3={web3} contract={contract} account={account} />}
          </>
        ) : (
          <p className="text-center text-white">Please connect your wallet to interact with the contract.</p>
        )}
        <div className="bg-white bg-opacity-90 shadow-lg rounded-lg p-6 card">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">Debug Information</h2>
          <p><strong>Network:</strong> {debugInfo.network}</p>
          <p><strong>Contract Address:</strong> {debugInfo.contract}</p>
        </div>
      </main>
      <footer className="mt-12 text-center text-white">
        <p className="mb-4">
          Disclaimer: This platform involves risks, including smart contract vulnerabilities and market volatility. Users are responsible for their own losses. Not financial advice.
        </p>
        <a
          href="https://x.com/pulsestrategy"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link flex items-center justify-center"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Follow @pulsestrategy
        </a>
      </footer>
    </div>
  );
}

export default App;
