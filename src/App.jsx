import { useState, useEffect, useCallback, useRef } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import UserInfo from "./components/UserInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import ClaimPLStr from "./components/ClaimPLStr";
import AdminPanel from "./components/AdminPanel";
import WeightUpdate from "./components/WeightUpdate";
import FrontPage from "./components/FrontPage";
import { getWeb3, getAccount, contractAddresses } from "./web3";
import { PLStr_ABI, xBond_ABI, iBond_ABI } from "./web3";
import "./index.css";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractSymbol, setContractSymbol] = useState(() => {
    const savedSymbol = localStorage.getItem("contractSymbol");
    return savedSymbol && ["xBond", "iBond", "PLStr"].includes(savedSymbol) ? savedSymbol : "xBond";
  });
  const [isController, setIsController] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFrontPage, setShowFrontPage] = useState(true);
  const mountedRef = useRef(true);
  const lastInitRef = useRef(0); // Timestamp for last initialization

  const contractABIs = {
    PLStr: PLStr_ABI,
    xBond: xBond_ABI,
    iBond: iBond_ABI,
  };

  const CONTROLLER_ADDRESS = "0x6aaE8556C69b795b561CB75ca83aF6187d2F0AF5";

  useEffect(() => {
    localStorage.setItem("contractSymbol", contractSymbol);
  }, [contractSymbol]);

  const initializeApp = useCallback(async (newContractSymbol = contractSymbol) => {
    const now = Date.now();
    if (now - lastInitRef.current < 2000) {
      console.log("Initialization throttled to prevent flickering");
      return;
    }
    lastInitRef.current = now;

    if (!mountedRef.current) return;

    setLoading(true);
    setError("");
    setContract(null);
    try {
      let web3Instance = web3;
      if (!web3Instance) {
        web3Instance = await Promise.race([
          getWeb3(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Web3 provider timeout")), 10000)),
        ]);
        if (!web3Instance) {
          throw new Error("Failed to initialize Web3. Please connect your wallet.");
        }
        setWeb3(web3Instance);
      }

      const chainId = Number(await web3Instance.eth.getChainId());
      if (chainId !== 369) {
        throw new Error("Please connect to PulseChain (chainId 369).");
      }
      setChainId(chainId);

      const account = await getAccount(web3Instance);
      if (!account) {
        throw new Error("No account found. Please connect your wallet.");
      }
      setAccount(account);

      const contractAddress = contractAddresses[369]?.[newContractSymbol];
      const contractABI = contractABIs[newContractSymbol];
      if (!contractAddress || !contractABI) {
        throw new Error(`Contract address or ABI not found for ${newContractSymbol} on PulseChain`);
      }

      const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
      setContract(contractInstance);

      setIsController(account.toLowerCase() === CONTROLLER_ADDRESS.toLowerCase());
      console.log("App initialized:", {
        chainId,
        account,
        contractAddress,
        contractSymbol: newContractSymbol,
      });
    } catch (error) {
      console.error("App initialization failed:", {
        error: error.message,
        contractSymbol: newContractSymbol,
      });
      setError(`Initialization failed: ${error.message || "Unknown error"}`);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [web3, contractSymbol, contractABIs]);

  const onTransactionSuccess = () => {
    console.log("Transaction successful, reinitializing app...");
    initializeApp();
  };

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleContractChange = useCallback(debounce((symbol) => {
    setContractSymbol(symbol);
    initializeApp(symbol);
  }, 500), [initializeApp]);

  useEffect(() => {
    mountedRef.current = true;
    if (!showFrontPage) {
      initializeApp();
    }

    if (window.ethereum) {
      const handleChainChanged = () => {
        console.log("Chain changed, reinitializing...");
        initializeApp();
      };
      const handleAccountsChanged = (accounts) => {
        console.log("Accounts changed:", accounts);
        setAccount(accounts[0] || null);
        initializeApp();
      };

      window.ethereum.on("chainChanged", handleChainChanged);
      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        mountedRef.current = false;
        window.ethereum.removeListener("chainChanged", handleChainChanged);
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [showFrontPage, initializeApp]);

  const handleEnterApp = () => {
    setShowFrontPage(false);
  };

  if (showFrontPage) {
    return <FrontPage onEnterApp={handleEnterApp} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
        <p className="text-center text-white">Loading contract data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-center text-purple-600">PulseStrategy</h1>
          <button
            onClick={() => setShowFrontPage(true)}
            className="text-purple-600 hover:underline"
          >
            Back to Home
          </button>
        </div>
        <p className="text-center text-gray-600 mt-2">
          {account
            ? `Interact with the ${contractSymbol} contract on PulseChain`
            : `Connect your wallet to interact with the contract`}
        </p>
        <div className="mt-4 flex items-center gap-1">
          <label className="text-gray-600 text-sm mr-1 whitespace-nowrap">Select Contract:</label>
          {["xBond", "iBond", "PLStr"].map((symbol) => (
            <button
              key={symbol}
              onClick={() => handleContractChange(symbol)}
              disabled={!web3 || chainId !== 369 || loading}
              className={`px-2 py-1 text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
                contractSymbol === symbol
                  ? "btn-primary"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              } ${(!web3 || chainId !== 369 || loading) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {symbol}
            </button>
          ))}
        </div>
        <ConnectWallet
          account={account}
          web3={web3}
          contractAddress={contractAddresses[369]?.[contractSymbol] || ""}
          chainId={chainId}
          contractSymbol={contractSymbol}
        />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {error ? (
          <p className="text-center text-red-700">{error}</p>
        ) : !web3 || !account || !contract || chainId !== 369 ? (
          <p className="text-center text-white">Please connect your wallet to PulseChain to interact with the contract.</p>
        ) : (
          <>
            <ContractInfo
              contract={contract}
              web3={web3}
              chainId={chainId}
              contractSymbol={contractSymbol}
              onTransactionSuccess={onTransactionSuccess}
            />
            <UserInfo
              contract={contract}
              account={account}
              web3={web3}
              chainId={chainId}
              contractSymbol={contractSymbol}
            />
            {contractSymbol !== "PLStr" && (
              <IssueShares
                contract={contract}
                account={account}
                web3={web3}
                chainId={chainId}
                contractSymbol={contractSymbol}
                onTransactionSuccess={onTransactionSuccess}
              />
            )}
            <RedeemShares
              contract={contract}
              account={account}
              web3={web3}
              chainId={chainId}
              contractSymbol={contractSymbol}
              onTransactionSuccess={onTransactionSuccess}
            />
            {contractSymbol === "PLStr" && (
              <>
                <ClaimPLStr
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                  onTransactionSuccess={onTransactionSuccess}
                />
                <WeightUpdate
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  onTransactionSuccess={onTransactionSuccess}
                />
                {isController && (
                  <AdminPanel
                    contract={contract}
                    account={account}
                    web3={web3}
                    chainId={chainId}
                    contractSymbol={contractSymbol}
                    appIsController={isController}
                    onTransactionSuccess={onTransactionSuccess}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>
      <footer className="mt-16 w-full text-center text-gray-500 text-xs">
        <div className="mb-1">
          <a
            href="https://github.com/PulseStrategy369/PulseStrategy"
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
};

export default App;
