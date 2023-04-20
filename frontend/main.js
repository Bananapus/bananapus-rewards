import "./style.css";
import * as trees from "./assets/trees.json";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import { ethers } from "ethers";

let wallets, address, ethersProvider, ethersSigner;

// Basic document structure
document.querySelector("#app").innerHTML = `
  <div>
    <h1>Bananapus Rewards</h1>
    <p>Join the <a href="https://discord.gg/ErQYmth4dS">Discord server</a> to learn more.</p>
    <button id="connect">Connect</button>
    <button id="check">Check Rewards</button>
  </div>
  <div class="card" id="claim"></div>`;

// web3-onboard boilerplate
const injected = injectedModule();
const onboard = Onboard({
  wallets: [injected],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: import.meta.env.VITE_MAINNET_RPC_URL,
    },
    {
      id: "0x89",
      token: "MATIC",
      label: "Polygon Mainnet",
      rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL,
    },
    {
      id: "0xa",
      token: "ETH",
      label: "Optimism",
      rpcUrl: import.meta.env.VITE_OPTIMISM_RPC_URL,
    },
    {
      id: "0xa4b1",
      token: "ETH",
      label: "Arbitrum One",
      rpcUrl: import.meta.env.VITE_ARBITRUM_RPC_URL,
    },
  ],
});

// Connect wallet
document.getElementById("connect").addEventListener("click", async () => {
  wallets = await onboard.connectWallet();
  if (wallets[0]) {
    document.getElementById("connect").innerText = "Connected";
    ethersProvider = new ethers.BrowserProvider(wallets[0].provider, "any");
    ethersSigner = await ethersProvider.getSigner();
  } else {
    document.getElementById("connect").innerText = "Connect";
    ethersProvider = null;
    ethersSigner = null;
  }
  console.log(wallets);
});

// Check for rewards, and if they exist, create claim buttons
document.getElementById("check").addEventListener("click", () => {
  if (!wallets || !wallets[0]?.accounts[0]?.address) {
    alert("You must connect your wallet.");
    return;
  }

  // Clear any existing buttons
  document.getElementById("claim").textContent = ''

  address = wallets[0]?.accounts[0]?.address;
  console.log(address);

  for (const [chainId, tree_obj] of Object.entries(Object.values(trees)[0])) {
    if (chainId === "roots") continue;
    const tree = StandardMerkleTree.load(tree_obj);

    for (const [i, v] of tree.entries()) {
      if (v[0] === address) {
        const proof = tree.getProof(i);
        newClaimer(chainId, v[0], v[1], proof)
        console.log(
          `Proof to claim ${v[1]} tokens on chain ${chainId}:`,
          proof
        );
      }
    }
  }
});

// Create claim button
function newClaimer(chainId, address, amount, proof) {
  const claimButton = document.createElement("button");
  claimButton.innerText = `Claim on 0x${chainId}`;

  claimButton.onclick = async () => {
    if (!ethersSigner) {
      alert("You must have a signer");
      return;
    }

    console.log("ChainID:", chainId, "CHAINID HEX", parseInt(chainId).toString(16))
    await onboard.setChain({ chainId: "0x" + parseInt(chainId).toString(16)})
    console.log(`Claiming ${amount} for ${address} on chain ${chainId} with proof:`, proof)

    // Placeholder. Once contract is ready, this will claim rewards.
    const txn = await ethersSigner.sendTransaction({
      to: address,
      value: 1,
    })

    const receipt = await txn.wait()
    console.log(receipt)
  };

  document.getElementById("claim").appendChild(claimButton);
}
