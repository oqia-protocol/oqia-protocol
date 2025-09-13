document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connect-wallet-btn');
    const walletStatus = document.getElementById('wallet-status');
    const walletAddress = document.getElementById('wallet-address');
    const mintAgentBtn = document.getElementById('mint-agent-btn');
    const grantSessionKeyBtn = document.getElementById('grant-session-key-btn');

    let provider;
    let signer;

    connectWalletBtn.addEventListener('click', async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                const address = await signer.getAddress();

                walletStatus.textContent = 'Connected';
                walletAddress.textContent = address;
                connectWalletBtn.textContent = 'Wallet Connected';
                connectWalletBtn.disabled = true;
            } catch (error) {
                console.error('User rejected wallet connection:', error);
                walletStatus.textContent = 'Connection Failed';
            }
        } else {
            alert('Please install a web3 wallet like MetaMask.');
        }
    });

    mintAgentBtn.addEventListener('click', async () => {
        // TODO: Implement agent minting logic
        alert('Minting agent...');
    });

    grantSessionKeyBtn.addEventListener('click', async () => {
        const sessionKeyAddress = document.getElementById('session-key-address').value;
        const sessionKeyFunction = document.getElementById('session-key-function').value;
        const sessionKeyValidUntil = document.getElementById('session-key-valid-until').value;
        const sessionKeyAllowance = document.getElementById('session-key-allowance').value;

        // TODO: Implement session key granting logic
        alert(`Granting session key to ${sessionKeyAddress}`);
    });
});
