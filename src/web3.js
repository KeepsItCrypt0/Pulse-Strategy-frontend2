import Web3 from "web3";

const contractAddress = "0x6c1dA678A1B615f673208e74AB3510c22117090e";
const vPLSAddress = "0x0181e249c507d3b454dE2444444f0Bf5dBE72d09";
const contractABI = [/* Full ABI from previous response, unchanged */];

const rpcUrls = [
  "https://eth-mainnet.g.alchemy.com/v2/60nF9qKWaj8FPzlhEuGUmam6bn2tIgBN",
  "https://rpc.ankr.com/eth/8d7581cb1a742b4ebd60ddb0ff4049a193726fef2999a3acb4dc53293cf089b1",
  "https://mainnet.infura.io/v3/0c7b379c34424040826f02574f89b57d",
];

const getWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await web3.eth.getChainId();
      if (chainId !== 1) {
        throw new Error("Please switch to Ethereum Mainnet");
      }
      return web3;
    } catch (error) {
      console.error("Web3 wallet connection failed:", error);
      throw error;
    }
  } else {
    for (const url of rpcUrls) {
      try {
        const web3 = new Web3(url);
        await web3.eth.getBlockNumber(); // Test RPC
        return web3;
      } catch (error) {
        console.error(`RPC ${url} failed:`, error);
      }
    }
    throw new Error("No valid RPC endpoints available");
  }
};

const getContract = async (web3) => {
  try {
    return new web3.eth.Contract(contractABI, contractAddress);
  } catch (error) {
    console.error("Failed to initialize contract:", error);
    throw error;
  }
};

const getVPLSContract = async (web3) => {
  const vPLSABI = [
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },
    {
      constant: false,
      inputs: [
        { name: "_spender", type: "address" },
        { name: "_value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "success", type: "bool" }],
      type: "function",
    },
  ];
  try {
    return new web3.eth.Contract(vPLSABI, vPLSAddress);
  } catch (error) {
    console.error("Failed to initialize vPLS contract:", error);
    throw error;
  }
};

export { getWeb3, getContract, getVPLSContract, contractAddress, vPLSAddress };
