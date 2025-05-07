import Web3 from "web3";

const contractAddress = "0x6c1dA678A1B615f673208e74AB3510c22117090e";
const vPLSAddress = "0x0181e249c507d3b454dE2444444f0Bf5dBE72d09";

const minimalABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "getContractInfo",
    "outputs": [
      { "name": "contractBalance", "type": "uint256" },
      { "name": "remainingIssuancePeriod", "type": "uint256" }
    ],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "getVPLSBackingRatio",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      { "name": "_account", "type": "address" },
      { "name": "_amount", "type": "uint256" }
    ],
    "name": "getRedeemableStakedPLS",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [{ "name": "", "type": "address" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_amount", "type": "uint256" }],
    "name": "issueShares",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_amount", "type": "uint256" }],
    "name": "redeemShares",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_amount", "type": "uint256" }],
    "name": "depositStakedPLS",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_amount", "type": "uint256" }],
    "name": "mintShares",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_token", "type": "address" },
      { "name": "_recipient", "type": "address" },
      { "name": "_amount", "type": "uint256" }
    ],
    "name": "recoverTokens",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [{ "name": "_newOwner", "type": "address" }],
    "name": "transferOwnership",
    "outputs": [],
    "type": "function"
  }
];

const vPLSABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function"
  }
];

const rpcUrls = [
  "https://eth-mainnet.g.alchemy.com/v2/60nF9qKWaj8FPzlhEuGUmam6bn2tIgBN",
  "https://rpc.ankr.com/eth/8d7581cb1a742b4ebd60ddb0ff4049a193726fef2999a3acb4dc53293cf089b1",
  "https://mainnet.infura.io/v3/0c7b379c34424040826f02574f89b57d",
  "https://cloudflare-eth.com"
];

const getWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await web3.eth.getChainId();
      if (chainId !== 1) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1" }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x1",
                  chainName: "Ethereum Mainnet",
                  rpcUrls: [rpcUrls[0]],
                  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                  blockExplorerUrls: ["https://etherscan.io"],
                },
              ],
            });
          } else {
            console.warn("User rejected network switch:", switchError);
          }
        }
      }
      console.log("Web3 initialized with MetaMask");
      return web3;
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  } else {
    for (let i = 0; i < rpcUrls.length; i++) {
      try {
        const web3 = new Web3(rpcUrls[i]);
        await web3.eth.getBlockNumber({ timeout: 5000 });
        console.log(`Connected to RPC: ${rpcUrls[i]}`);
        return web3;
      } catch (error) {
        console.error(`RPC ${rpcUrls[i]} failed:`, error);
      }
    }
    throw new Error("No valid RPC endpoints available");
  }
};

const getContract = async (web3) => {
  try {
    const contract = new web3.eth.Contract(minimalABI, contractAddress);
    await contract.methods.getContractInfo().call();
    console.log("PulseStrategy contract initialized");
    return contract;
  } catch (error) {
    console.error("Failed to initialize PulseStrategy contract:", error);
    throw new Error(`PulseStrategy contract failed: ${error.message}`);
  }
};

const getVPLSContract = async (web3) => {
  try {
    const contract = new web3.eth.Contract(vPLSABI, vPLSAddress);
    await contract.methods.balanceOf(vPLSAddress).call();
    console.log("vPLS contract initialized");
    return contract;
  } catch (error) {
    console.error("Failed to initialize vPLS contract:", error);
    throw new Error(`vPLS contract failed: ${error.message}`);
  }
};

export { getWeb3, getContract, getVPLSContract, contractAddress, vPLSAddress };
