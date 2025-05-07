import Web3 from "web3";

const contractAddress = "0x6c1dA678A1B615f673208e74AB3510c22117090e";
const stakedPLSAddress = "0x0181e249c507d3b454dE2444444f0Bf5dBE72d09";
const contractABI = [
  // Paste the full ABI provided in the question here
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ... (rest of the ABI from the original question)
];

const rpcUrls = [
  "https://eth-mainnet.g.alchemy.com/v2/60nF9qKWaj8FPzlhEuGUmam6bn2tIgBN",
  "https://rpc.ankr.com/eth/8d7581cb1a742b4ebd60ddb0ff4049a193726fef2999a3acb4dc53293cf089b1",
  "https://mainnet.infura.io/v3/0c7b379c34424040826f02574f89b57d",
];

const getWeb3 = async () => {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    return web3;
  } else {
    return new Web3(rpcUrls[0]);
  }
};

const getContract = async (web3) => {
  return new web3.eth.Contract(contractABI, contractAddress);
};

const getStakedPLSContract = async (web3) => {
  const stakedPLSABI = [
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
  return new web3.eth.Contract(stakedPLSABI, stakedPLSAddress);
};

export { getWeb3, getContract, getStakedPLSContract, contractAddress, stakedPLSAddress };
