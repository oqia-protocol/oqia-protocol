/* global window, document, ethers, alert */

const connectWalletBtn = document.getElementById("connect-wallet-btn");
const walletStatus = document.getElementById("wallet-status");
const mintingSection = document.getElementById("minting-section");
// const botStatusSection = document.getElementById("bot-status-section");

let provider;
let signer;

connectWalletBtn.addEventListener("click", async () => {
    if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        const address = await signer.getAddress();

        walletStatus.textContent = `Connected: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        connectWalletBtn.textContent = "Connected";
        connectWalletBtn.disabled = true;

        mintingSection.classList.remove("hidden");
    } catch (error) {
        console.error("Error connecting to wallet:", error);
        walletStatus.textContent = "Connection failed.";
    }
});
