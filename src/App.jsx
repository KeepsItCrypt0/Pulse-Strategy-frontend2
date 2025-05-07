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
 console.log("App initialized:", { account: accounts[0], owner });
 } catch (error) {
 console.error("Web3 initialization failed:", error);
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
 </main>
 <footer className="mt-12 text-center text-white">
 <p className="mb-4">
 Disclaimer: This platform involves risks, including smart contract vulnerabilities and market volatility. Users are responsible for their own losses. Not financial advice.
 </p>
 <div className="flex justify-center space-x-4">
 <a
 href="https://x.com/pulsestrategy"
 target="_blank"
 rel="noopener noreferrer"
 className="footer-link flex items-center"
 >
 <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
 <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H 16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
 </svg>
 Follow @pulsestrategy
 </a>
 <span className="text-purple-300">|</span>
 <a
 href="https://github.com/KeepsItCrypt0/PulseStrategy"
 target="_blank"
 rel="noopener noreferrer"
 className="footer-link flex items-center"
 >
 <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
 <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 17.773 3.633 17.398 3.633 17.398c-1.146-.583.087-.573.087-.573 1.268.09 1.937 1.303 1.937 1.303 1.126 1.926 2.957 1.37 3.678 1.048.115-.815.444-1.37.811-1.685-2.828-.32-5.803-1.414-5.803-6.292 0-1.39.496-2.523 1.31-3.415-.132-.323-.568-1.62.124-3.374 0 0 1.07-.344 3.502 1.305 1.016-.282 2.107-.423 3.192-.428 1.085.005 2.176.146 3.192.428 2.43-1.649 3.498-1.305 3.498-1.305.694 1.754.258 3.051.126 3.374.817.892 1.31 2.025 1.31 3.415 0 4.89-2.979 5.97-5.816 6.287.458.395.867 1.175.867 2.368 0 1.708-.015 3.086-.015 3.505 0 .322.216.694.825.577C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
 </svg>
 View Contract on GitHub
 </a>
 </div>
 </footer>
 </div>
 );
}

export default App;
