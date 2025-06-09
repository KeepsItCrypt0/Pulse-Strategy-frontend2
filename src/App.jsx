import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import AdminPanel from "./components/AdminPanel";
import UserInfo from "./components/UserInfo";
import { getWeb3, getContract, getAccount, contractAddresses, switchNetwork } from "./web3";
import "./index.css";

function App() {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [isController, setIsController] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("Unknown Network");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateNetwork = async (web3Instance) => {
    try {
      if (!web3Instance) throw new Error("Web3 not initialized");
      const id = Number(await web3Instance.eth.getChainId());
      setChainId(id);
      setNetworkName(id === 1 ? "Ethereum" : id === 369 ? "PulseChain" : "Unknown Network");
      console.log("Network updated:", { chainId: id, networkName });
      return id;
    } catch (err) {
      console.error("Failed to update network:", err);
      setError("Failed to detect network. Please ensure your wallet is connected.");
      return null;
    }
  };

  const initializeApp = async () => {
    setLoading(true);
    setError("");
    try {
      const web3Instance = await getWeb3();
      if (!web3Instance) {
        setChainId(null);
        setNetworkName("Disconnected");
        setLoading(false);
        return;
      }
      setWeb3(web3Instance);

      const chainId = await updateNetwork(web3Instance);
      if (!chainId) throw new Error("Failed to detect chainId");

      const accounts = await getAccount(web3Instance);
      setAccount(accounts);

      const contractInstance = await getContract(web3Instance);
      if (!contractInstance) {
        throw new Error("Failed to initialize contract");
      }
      setContract(contractInstance);

      if (contractInstance && accounts && chainId === 1) {
        try {
          if (!contractInstance.methods.owner) {
            throw new Error("owner method not found in PLSTR contract");
          }
          const owner = await contractInstance.methods.owner().call();
          const isOwner = accounts?.toLowerCase() === owner?.toLowerCase();
          setIsController(isOwner);
          console.log("Controller check (PLSTR):", {
            account: accounts,
            owner,
            isController: isOwner,
            chainId,
            contractAddress: contractInstance._address,
          });
        } catch (err) {
          console.error("Failed to fetch controller:", err);
          setIsController(false);
          setError(`Failed to verify controller: ${err.message || "Unknown error"}`);
        }
      } else if (chainId === 369) {
        setIsController(false);
        console.log("Skipped controller check for xBOND:", { chainId, account: accounts });
      }
      console.log("App initialized:", {
        chainId,
        account: accounts,
        contractAddress: contractInstance?._address,
      });
    } catch (error) {
      console.error("App initialization failed:", error);
      setError(`Initialization failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeApp();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        console.log("Chain changed, reinitializing...");
        initializeApp();
      });
      window.ethereum.on("accountsChanged", (accounts) => {
        console.log("Accounts changed:", accounts);
        setAccount(accounts[0] || null);
        initializeApp();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("chainChanged");
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, []);

  const handleNetworkChange = async (e) => {
    if (!web3) return;
    const targetChainId = Number(e.target.value);
    try {
      setLoading(true);
      setError("");
      await switchNetwork(web3, targetChainId);
      await initializeApp();
      console.log("Network switch successful:", { targetChainId });
    } catch (err) {
      console.error("Network switch failed:", err);
      setError(`Failed to switch network: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <h1 className="text-3xl font-bold text-center text-purple-600">
          {chainId === 1 ? "PulseStrategy" : chainId === 369 ? "PulseStrategy" : "Connect Wallet"}
        </h1>
        <p className="text-center text-gray-600 mt-2">
          {account
            ? `Interact with the ${chainId === 1 ? "PLSTR" : "xBOND"} contract on ${networkName}`
            : `Connect your wallet to interact with the contract`}
        </p>
        <div className="mt-4">
          <label className="text-gray-600 mr-2">Select Network:</label>
          <select
            value={chainId || ""}
            onChange={handleNetworkChange}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={!web3}
          >
            <option value="1">Ethereum (PLSTR)</option>
            <option value="369">PulseChain (xBOND)</option>
          </select>
        </div>
        {account && (
          <p className="text-center text-gray-600 mt-2">
            Wallet: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
        <ConnectWallet
          account={account}
          web3={web3}
          contractAddress={contractAddresses[chainId] || ""}
          chainId={chainId}
        />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {loading ? (
          <p className="text-center text-white">Loading...</p>
        ) : error ? (
          <>
            <p className="text-center text-red-700">{error}</p>
            {account && chainId && (
              <>
                <ContractInfo contract={contract} web3={web3} chainId={chainId} />
                <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
                <IssueShares web3={web3} contract={contract} account={account} chainId={chainId} />
                <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
                {chainId === 1 && isController && (
                  <AdminPanel web3={web3} contract={contract} account={account} chainId={chainId} />
                )}
              </>
            )}
          </>
        ) : account && chainId ? (
          <>
            <ContractInfo contract={contract} web3={web3} chainId={chainId} />
            <UserInfo contract={contract} account={account} web3={web3} chainId={chainId} />
            <IssueShares web3={web3} contract={contract} account={account} chainId={chainId} />
            <RedeemShares contract={contract} account={account} web3={web3} chainId={chainId} />
            {chainId === 1 && isController && (
              <AdminPanel web3={web3} contract={contract} account={account} chainId={chainId} />
            )}
          </>
        ) : (
          <p className="text-center text-white">Please connect your wallet to interact with the contract.</p>
        )}
      </main>
      <footer className="mt-16 w-full text-center text-gray-600 text-xs">
        <div className="mb-1">
          <a
            href="https://github.com/KeepsItCrypt0/PulseStrategy"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link mx-1"
          >
            View Contracts on GitHub
          </a>
          <span>|</span>
          <a
            href="https://x.com/PulseStrategy"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link mx-1"
          >
            Follow @PulseStrategy on X
          </a>
        </div>
        <p className="max-w-lg mx-auto">
          <strong>Disclaimer:</strong> PulseStrategy is a decentralized finance (DeFi) platform. 
          Investing in DeFi involves significant risks, including the potential loss of all invested funds. 
          Cryptocurrencies and smart contracts are volatile and may be subject to hacks, bugs, or market fluctuations. 
          Always conduct your own research and consult with a financial advisor before participating. 
          By using this platform, you acknowledge these risks and agree that PulseStrategy and its developers are not liable for any losses.
        </p>
      </footer>
    </div>
  );
}

export default App;
