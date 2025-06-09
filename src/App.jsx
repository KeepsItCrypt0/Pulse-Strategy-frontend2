import { useState, useEffect } from "react";
import ConnectWallet from "./components/ConnectWallet";
import ContractInfo from "./components/ContractInfo";
import UserInfo from "./components/UserInfo";
import IssueShares from "./components/IssueShares";
import RedeemShares from "./components/RedeemShares";
import SwapBurn from "./components/SwapBurn";
import ClaimPLSTR from "./components/ClaimPLSTR";
import AdminPanel from "./components/AdminPanel";
import { getWeb3, getAccount } from "./web3";
import { tokenAddresses, PLSTR_ABI, pBOND_ABI, xBOND_ABI, iBOND_ABI, hBOND_ABI } from "./web3";
import "./index.css";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractSymbol, setContractSymbol] = useState("PLSTR");
  const [isController, setIsController] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const contractABIs = {
    PLSTR: PLSTR_ABI,
    pBOND: pBOND_ABI,
    xBOND: xBOND_ABI,
    iBOND: iBOND_ABI,
    hBOND: hBOND_ABI,
  };

  const initializeApp = async () => {
    setLoading(true);
    setError("");
    try {
      const web3Instance = await getWeb3();
      if (!web3Instance) {
        setChainId(null);
        setLoading(false);
        setError("Failed to initialize Web3. Please connect your wallet.");
        return;
      }
      setWeb3(web3Instance);

      const chainId = Number(await web3Instance.eth.getChainId());
      setChainId(chainId);

      if (chainId !== 369) {
        setError("Please connect to PulseChain (chainId 369).");
        setLoading(false);
        return;
      }

      const accounts = await getAccount(web3Instance);
      setAccount(accounts);

      const contractAddress = tokenAddresses[369]?.[contractSymbol];
      const contractABI = contractABIs[contractSymbol];
      if (!contractAddress || !contractABI) {
        throw new Error(`Contract address or ABI not found for ${contractSymbol} on PulseChain`);
      }

      const contractInstance = new web3Instance.eth.Contract(contractABI, contractAddress);
      setContract(contractInstance);

      if (contractInstance && accounts) {
        try {
          if (!contractInstance.methods.owner) {
            throw new Error(`owner method not found in ${contractSymbol} contract`);
          }
          const owner = await contractInstance.methods.owner().call();
          const isOwner = accounts?.toLowerCase() === owner?.toLowerCase();
          setIsController(isOwner);
          console.log("Controller check:", {
            account: accounts,
            owner,
            isController: isOwner,
            chainId,
            contractAddress,
            contractSymbol,
          });
        } catch (err) {
          console.error("Failed to fetch controller:", err);
          setIsController(false);
          setError(`Failed to verify controller: ${err.message || "Unknown error"}`);
        }
      }
      console.log("App initialized:", {
        chainId,
        account: accounts,
        contractAddress,
        contractSymbol,
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
  }, [contractSymbol]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center p-4">
      <header className="w-full max-w-4xl bg-white bg-opacity-90 shadow-lg rounded-lg p-6 mb-6 card">
        <h1 className="text-3xl font-bold text-center text-purple-600">PulseStar DApp</h1>
        <p className="text-center text-gray-600 mt-2">
          {account
            ? `Interact with the ${contractSymbol} contract on PulseChain`
            : `Connect your wallet to interact with the contract`}
        </p>
        <div className="mt-4">
          <label className="text-gray-600 mr-2">Select Contract:</label>
          <select
            value={contractSymbol}
            onChange={(e) => setContractSymbol(e.target.value)}
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={!web3 || chainId !== 369}
          >
            {["PLSTR", "pBOND", "xBOND", "iBOND", "hBOND"].map((symbol) => (
              <option key={symbol} value={symbol}>
                {symbol}
              </option>
            ))}
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
          contractAddress={tokenAddresses[369]?.[contractSymbol] || ""}
          chainId={chainId}
          onConnect={initializeApp}
        />
      </header>
      <main className="w-full max-w-4xl space-y-6">
        {loading ? (
          <p className="text-center text-white">Loading...</p>
        ) : error ? (
          <>
            <p className="text-center text-red-700">{error}</p>
            {account && chainId === 369 && contract && (
              <>
                <ContractInfo
                  contract={contract}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                <UserInfo
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                {contractSymbol === "PLSTR" ? (
                  <>
                    <IssueShares
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    <RedeemShares
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    <ClaimPLSTR
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    {isController && (
                      <AdminPanel
                        contract={contract}
                        account={account}
                        web3={web3}
                        chainId={chainId}
                        contractSymbol={contractSymbol}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <IssueShares
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    <RedeemShares
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    <SwapBurn
                      contract={contract}
                      account={account}
                      web3={web3}
                      chainId={chainId}
                      contractSymbol={contractSymbol}
                    />
                    {isController && (
                      <AdminPanel
                        contract={contract}
                        account={account}
                        web3={web3}
                        chainId={chainId}
                        contractSymbol={contractSymbol}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : account && chainId === 369 && contract ? (
          <>
            <ContractInfo
              contract={contract}
              web3={web3}
              chainId={chainId}
              contractSymbol={contractSymbol}
            />
            <UserInfo
              contract={contract}
              account={account}
              web3={web3}
              chainId={chainId}
              contractSymbol={contractSymbol}
            />
            {contractSymbol === "PLSTR" ? (
              <>
                <IssueShares
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                <RedeemShares
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                <ClaimPLSTR
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                {isController && (
                  <AdminPanel
                    contract={contract}
                    account={account}
                    web3={web3}
                    chainId={chainId}
                    contractSymbol={contractSymbol}
                  />
                )}
              </>
            ) : (
              <>
                <IssueShares
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                <RedeemShares
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                <SwapBurn
                  contract={contract}
                  account={account}
                  web3={web3}
                  chainId={chainId}
                  contractSymbol={contractSymbol}
                />
                {isController && (
                  <AdminPanel
                    contract={contract}
                    account={account}
                    web3={web3}
                    chainId={chainId}
                    contractSymbol={contractSymbol}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-center text-white">Please connect your wallet to PulseChain to interact with the contract.</p>
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
          <strong>Disclaimer:</strong> PulseStar is a decentralized finance (DeFi) platform.
          Investing in DeFi involves significant risks, including the potential loss of all invested funds.
          Cryptocurrencies and smart contracts are volatile and may be subject to hacks, bugs, or market fluctuations.
          Always conduct your own research and consult with a financial advisor before participating.
          By using this platform, you acknowledge these risks and agree that PulseStar and its developers are not liable for any losses.
        </p>
      </footer>
    </div>
  );
};

export default App;
